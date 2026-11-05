// A compact index the browser uses for "Today", progress, and "continue where I left off".
import { days, units, weekVerses, dayTitle, shortTheme, TYPE_LABEL } from '../../lib/data.js';
export function GET() {
  const body = {
    days: days.map((d) => [d.day, d.unit, d.week, d.type, dayTitle(d), shortTheme(d)]),
    units: units.map((x) => ({ id: x.id, title: x.title, first: x.firstDay, last: x.lastDay })),
    verses: weekVerses.map((v) => [v.ref, v.text]),
    labels: TYPE_LABEL,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
