// Text helpers. The site enforces the Catechism writing rules on every string it
// shows: no em or en dashes, and typographic quotes. So even text typed into the
// editor with a stray dash comes out clean.
export function smart(s) {
  s = s.replace(/\.\.\./g, '…');
  const out = []; let open = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]; const prev = i ? s[i - 1] : ' '; const nxt = i + 1 < s.length ? s[i + 1] : ' ';
    if (ch === "'") {
      if (!open && ' \n([“‘'.includes(prev) && nxt.trim()) { out.push('“'); open = true; }
      else if (open && ('.,!?;:)’”'.includes(prev) || ' \n.,;:!?)'.includes(nxt) || i + 1 === s.length)) { out.push('”'); open = false; }
      else out.push('’');
    } else if (ch === '"') {
      if (' \n([“'.includes(prev) && nxt.trim()) out.push(open ? '‘' : '“');
      else out.push(open ? '’' : '”');
    } else out.push(ch);
  }
  return out.join('');
}
export function clean(s) {
  if (s === undefined || s === null) return '';
  s = String(s).replace(/ — /g, ', ').replace(/—/g, ', ').replace(/–/g, '-');
  return /['"]/.test(s) ? smart(s) : s.replace(/\.\.\./g, '…');
}
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// **bold** and *italic* only
export function inline(s) {
  return esc(clean(s)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
export const paras = (s) => clean(s).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
