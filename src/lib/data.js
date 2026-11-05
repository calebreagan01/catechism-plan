// Loads every content file at build time and derives the cross-links:
// which books a day reads, which days read a book, which days read each psalm,
// and the memory verse for each week.
import fs from 'node:fs';
import path from 'node:path';
import { clean, slug } from './text.js';

const root = process.cwd();
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(root, 'content', ...p), 'utf8'));
const list = (d) =>
  fs.readdirSync(path.join(root, 'content', d)).filter((f) => f.endsWith('.json')).sort().map((f) => rd(d, f));

export const site = rd('site.json');
export const units = list('units').sort((a, b) => a.id - b.id);
export const days = list('days').sort((a, b) => a.day - b.day);
export const books = list('books').sort((a, b) => a.order - b.order).map((b) => ({ ...b, slug: slug(b.name) }));
export const glossary = rd('glossary.json').sort((a, b) => a.term.localeCompare(b.term));
export const downloads = rd('downloads.json');
export const YEAR_NAMES = { 1: 'Promise and Shadow', 2: 'Fulfillment' };

// ---- front-matter pages (content/pages/*.md)
function parsePage(file) {
  const raw = fs.readFileSync(path.join(root, 'content', 'pages', file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"')) { try { v = JSON.parse(v); } catch { /* keep */ } }
    else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    meta[line.slice(0, i).trim()] = v;
  }
  return { slug: file.replace(/\.md$/, ''), ...meta, body: m ? m[2] : raw };
}
export const pages = fs.readdirSync(path.join(root, 'content', 'pages')).filter((f) => f.endsWith('.md')).map(parsePage)
  .sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
export const page = (s) => pages.find((p) => p.slug === s);

// ---- derived: books read by each day
const bookNames = new Map(books.map((b) => [b.name, b]));
const ALIAS = { Psalm: 'Psalms', 'Song of Solomon': 'Song of Songs' };
function bookOf(seg) {
  seg = seg.trim();
  let m = seg.match(/^((?:[1-3] )?[A-Za-z]+(?: of [A-Za-z]+)?(?: [A-Z][a-z]+)?)\s+\d/);
  let name = m ? m[1] : null;
  if (!name) { m = seg.match(/^((?:[1-3] )?[A-Za-z ]+?)\s*$/); name = m ? m[1] : null; }
  if (!name) return null;
  name = ALIAS[name] || name;
  return bookNames.get(name) || null;
}
export const unmapped = [];
const readDays = (d) => d.type === 'primary' || d.type === 'psalm' || d.type === 'doctrinal';
for (const d of days) {
  d.books = [];
  if (!readDays(d) || !d.passage) continue;
  for (const seg of d.passage.split(';')) {
    const b = bookOf(seg);
    if (b) { if (!d.books.includes(b.slug)) d.books.push(b.slug); }
    else unmapped.push(`${d.day}: ${seg}`);
  }
}
for (const b of books) b.days = days.filter((d) => d.books.includes(b.slug)).map((d) => d.day);

// ---- psalms index
export const psalmDays = {};
for (const d of days) {
  if (!d.passage) continue;
  for (const seg of d.passage.split(';')) {
    const m = seg.trim().match(/^Psalms?\s+(\d+)/);
    if (m) (psalmDays[m[1]] ||= []).push(d.day);
  }
}

// ---- memory verses by week
export const lastWeek = Math.max(...days.map((d) => d.week));
export const weekVerses = [];
for (let w = 1; w <= lastWeek; w++) {
  const d = days.find((x) => x.day === w * 7 && x.memoryRef) || days.find((x) => x.week === w && x.type === 'rest' && x.memoryRef) || days.find((x) => x.day === days.length && x.memoryRef);
  weekVerses.push({ week: w, day: d ? d.day : null, ref: d ? clean(d.memoryRef) : '', text: d ? clean(d.memoryText) : '' });
}
export const weekVerse = (w) => weekVerses[w - 1];

// ---- helpers
export const byDay = (n) => days.find((d) => d.day === n);
export const unitDays = (id) => days.filter((d) => d.unit === id);
export const unitById = (id) => units.find((u) => u.id === id);
export const TYPE_LABEL = { primary: 'Reading', psalm: 'Psalm', doctrinal: 'Doctrine', rest: 'Sabbath', review: 'Review', review_rest: 'Review and Sabbath' };
export const dayTitle = (d) => d.passage || (d.type === 'rest' ? 'Sabbath Rest' : d.type === 'review_rest' ? 'Review and Sabbath Rest' : 'Review and Reflection');
export const shortTheme = (d) => clean(d.theme).replace(/^Doctrinal Pause:\s*/, '');
export const stats = {
  total: days.length,
  reading: days.filter((d) => d.type === 'primary').length,
  psalm: days.filter((d) => d.type === 'psalm').length,
  doctrinal: days.filter((d) => d.type === 'doctrinal').length,
  weeks: lastWeek,
};

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
export const u = (p = '') => BASE + String(p).replace(/^\/+/, '');
export const dayUrl = (n) => u(`day/${n}/`);
export const downloadFor = (kind, unit = 0) => downloads.find((x) => x.kind === kind && Number(x.unit) === Number(unit) && x.file);
