#!/usr/bin/env python3
"""One-time export: turns the Catechism JSON files and appendix text into the
site's editable content files. Dashes are removed and quotes made typographic.
Run from the repo root:  python3 scripts/export_content.py <path-to-catechism-pdf-folder>"""
import json, os, re, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/catechism-pdf'
J = os.path.join(SRC, '..', 'catechism-json')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SRC)
src = open(os.path.join(SRC, 'build_unit_docx.py')).read()
a = src.index('def smart(s):'); b = src.index('# ---------- document + styles')
exec(compile(src[a:b], 'clean', 'exec'), globals())
from appendix_text import HOWTO, GLOSSARY
from appendix2_text import AUTHOR, PSALMS, UNIT_PSALMS
from appendix_books import BOOKS

def wr(path, obj):
    p = os.path.join(ROOT, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        if isinstance(obj, str): f.write(obj)
        else: json.dump(obj, f, ensure_ascii=False, indent=2); f.write('\n')

def deep(o, title=False):
    if isinstance(o, str): return clean(o, title)
    if isinstance(o, list): return [deep(x, title) for x in o]
    if isinstance(o, dict): return {k: deep(v, title) for k, v in o.items()}
    return o

seq = json.load(open(f'{J}/master_sequence.json'))['sequence']
plan = json.load(open(f'{J}/plan_data.json')); plan = plan if isinstance(plan, list) else plan['units']
content = json.load(open(f'{J}/day_content.json'))

# ---- units
for u in plan:
    ref, text = split_verse(u['memory'])
    first = u['dayRange']['first']; last = u['dayRange']['last']
    wr(f'content/units/unit-{u["id"]:02d}.json', {
        'id': u['id'], 'year': u['year'], 'title': display_title(u['title']),
        'subtitle': clean(u['subtitle']), 'theme': clean(u['theme']),
        'firstDay': first, 'lastDay': last,
        'memoryRef': clean(ref).replace('–', '-'), 'memoryText': clean(text),
        'reviewQuestions': deep(u['reviewQs']),
        'psalmsNote': clean(UNIT_PSALMS.get(u['id'], '')),
    })

# ---- days
DROP = {'prayer', 'isRestDay', 'isReview', 'weekNumber'}
n = 0
for x in seq:
    d = x['newGlobalDay']; c = content.get(str(d))
    if not c: raise SystemExit(f'missing content for day {d}')
    rec = {'day': d, 'unit': x['unitId'], 'week': x['weekNumber'], 'dayInWeek': x['dayInWeek'],
           'type': x['type'], 'passage': clean(x['passage']) if x['type'] not in ('rest', 'review', 'review_rest') else '',
           'theme': clean(x['theme'])}
    if x['type'] == 'primary': rec['category'] = x.get('category', '')
    if x.get('verses'): rec['verses'] = x['verses']
    if x['type'] == 'doctrinal': rec['locus'] = x.get('locus', ''); rec['doctrine'] = clean(x.get('doctrine', '')); rec['summary'] = clean(x.get('summary', ''))
    for k, v in c.items():
        if k in DROP: continue
        if k == 'memoryVerse':
            ref, text = split_verse(v); rec['memoryRef'] = clean(ref); rec['memoryText'] = clean(text); continue
        rec[k] = deep(v)
    if 'reflectionQuestions' in rec and isinstance(rec['reflectionQuestions'], str): rec['reflectionQuestions'] = json.loads(rec['reflectionQuestions'])
    wr(f'content/days/day-{d:03d}.json', rec); n += 1
print(n, 'days')

# ---- books
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
for i, b in enumerate(BOOKS, 1):
    rec = {'order': i, 'name': b['name'], 'section': clean(b['section']), 'tagline': clean(b['tag']),
           'author': clean(b['author']), 'date': clean(b['date']), 'setting': clean(b['setting']),
           'genre': clean(b['genre']), 'theme': clean(b['theme']), 'keyVerse': clean(b['key']).replace('–', '-'),
           'outline': [{'ref': r_.replace('–', '-'), 'label': clean(l), 'level': lv} for r_, l, lv in b['outline']],
           'christInBook': clean(b.get('christ', '')), 'howToRead': clean(b.get('read', ''))}
    wr(f'content/books/{slug(b["name"])}.json', rec)
print(len(BOOKS), 'books')

# ---- markdown pages
REPL = [
 ('Each unit has its own document with a title page, a contents list, and one entry for every day.', 'Each unit has its own page with a contents list, and every day has its own page.'),
 ('The Weekly Checklist in this appendix lists all 129 weeks so you can see where you are and mark your progress.', 'The Weekly Checklist lists all 129 weeks so you can see where you are, and it keeps track of the days you mark as finished.'),
 ('The index in this appendix lists all 44.', 'The Doctrines page lists all 44.'),
 ('All 25 are listed in this appendix.', 'All 25 are listed on the Memory Verses page, together with each week\u2019s Sabbath verse.'),
 ('Prayer: a short prayer to turn what you read into conversation with God.', 'Prayer: two or three prompts to help you respond to God in your own words. The week\u2019s memory verse closes each day as a reminder.'),
]
def site_text(t):
    for a, b in REPL: t = t.replace(a, b)
    return t

def md(items, placeholders=None):
    out = []
    for k, t in items:
        t = site_text(clean(t))
        if k == 'h': out.append(f'\n## {t}\n')
        elif k in ('p0', 'p'): out.append(t + '\n')
        elif k == 'li': out.append(f'- {t}')
        elif k == 'term':
            lead, rest = t.split('|', 1); out.append(f'**{lead.strip()}** {rest.strip()}\n')
        elif k == 'fact':
            lead, rest = t.split('|', 1); out.append(f'- **{lead.strip()}.** {rest.strip()}')
        elif k == 'sig': out.append(f'*{t}*\n')
        elif k == 'table': out.append('\n{{UNIT_PSALMS}}\n')
        else: raise SystemExit('unknown kind ' + k)
    s = '\n'.join(out)
    return re.sub(r'\n{3,}', '\n\n', s).strip() + '\n'

def page(path, title, subtitle, kicker, items, order):
    fm = f'---\ntitle: {json.dumps(title)}\nsubtitle: {json.dumps(subtitle)}\nkicker: {json.dumps(kicker)}\norder: {order}\n---\n\n'
    wr(path, fm + md(items))

cut = [i for i, (k, t) in enumerate(HOWTO) if k == 'h' and t.startswith('What Else Is in This Appendix')][0]
page('content/pages/how-to-use.md', 'How to Use This Plan', 'A short guide for new readers', 'Start Here', HOWTO[:cut], 1)
page('content/pages/author-note.md', 'An Author’s Note', 'Where this plan comes from', 'Before You Begin', AUTHOR, 2)
page('content/pages/psalms-guide.md', 'The Psalms in This Plan', 'How and why they are used', 'Reference', PSALMS, 3)
wr('content/glossary.json', [{'term': clean(t), 'definition': clean(d)} for t, d in GLOSSARY])

# ---- site + downloads
wr('content/site.json', {
    'title': 'Catechism', 'subtitle': 'A Bible Reading Plan for New Believers',
    'tagline': 'Learn the Bible. Learn the faith. Learn to read it yourself.',
    'intro': 'A daily guide for new believers. Read a passage, understand it, see Christ in it, and respond to God in your own words. Six days of reading, one day of rest, for two and a half years.',
    'bibleNote': 'Bring your own Bible. The ESV is recommended.',
    'footerNote': 'Catechism. A Bible reading plan for new believers.',
    'accent': '#8A4B16',
})
dl = [{'title': 'The Complete Catechism', 'description': 'All 25 units and both appendices in one book.', 'kind': 'complete', 'unit': 0, 'file': ''},
      {'title': 'Appendix I: Companion Reference', 'description': 'How to use the plan, the author’s note, memory verses, the Psalms, the weekly checklist, and the glossary.', 'kind': 'appendix', 'unit': 0, 'file': ''},
      {'title': 'Appendix II: The Books of the Bible', 'description': 'Author, date, setting, theme, and outline for each of the 66 books.', 'kind': 'appendix', 'unit': 0, 'file': ''}]
for u in plan:
    dl.append({'title': f'Unit {u["id"]}: {display_title(u["title"])}', 'description': f'Days {u["dayRange"]["first"]}-{u["dayRange"]["last"]}. {clean(u["subtitle"])}', 'kind': 'unit', 'unit': u['id'], 'file': ''})
wr('content/downloads.json', dl)
print('done')
