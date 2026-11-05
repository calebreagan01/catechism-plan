# Catechism website: setup guide

This guide gets the site online for free, shows you how to edit it afterward, and shows you how to add PDFs. The whole thing costs nothing. The only optional cost is a custom web address (about $10 a year).

## How it works

- Your content (900 days, 25 units, 66 books, the appendices) is stored as plain files in the `content` folder.
- **GitHub** (free) stores those files and keeps a history of every change.
- **GitHub Pages** (free) turns them into the website each time something changes, and hosts it.
- **Pages CMS** (free) is the online editor. You change text in a form, press Save, and the site rebuilds itself in about three minutes.
- Reader progress is saved in each reader's own browser. There are no accounts and nothing to maintain.

## Part 1. Put the site online

1. Create a free account at github.com (skip this if you have one).
2. Create a new repository named `catechism-plan`. Choose **Public**, because free GitHub Pages hosting needs a public repository. Everything in it will also be on the public site anyway.
3. Put the project files in the repository. Pick one way:
   - **GitHub Desktop (no typing).** Install the free GitHub Desktop app. Choose File, Add Local Repository, select the `catechism-site` folder, then publish it to the `catechism-plan` repository.
   - **Claude Code.** Open the `catechism-site` folder in Claude Code and ask: "Create a public GitHub repository called catechism, commit everything, and push it to the main branch." Claude Code can do this for you.
   - The GitHub website will not work for this step, because it accepts only 100 files per upload and the project has more than 1,000.
4. In the repository, open **Settings, then Pages**. Under **Source**, choose **GitHub Actions**.
5. Open the **Actions** tab. A workflow called "Deploy site" runs automatically (if it did not, press "Run workflow"). Wait for the green check, about three minutes.
6. Your site is now at `https://YOUR-USERNAME.github.io/catechism-plan/`. Settings, then Pages, shows the exact address.

## Part 2. Edit the content after it is live

1. Go to app.pagescms.org and sign in with GitHub.
2. Install the Pages CMS GitHub app when asked, and give it access to only the `catechism-plan` repository.
3. Open the `catechism-plan` repository in Pages CMS. You will see these sections:
   - **Daily readings (900 days):** every part of every day.
   - **Units, Books of the Bible, Guide pages, Glossary, Site wording.**
   - **PDF downloads list.**
4. Open an item, change the text, and press **Save**. Saving updates the repository, which rebuilds the site. Your change is live in about three minutes.

Things to know while editing:

- Separate paragraphs with a blank line.
- You do not need to worry about dashes or quote marks. The site changes em and en dashes and straight quotes automatically.
- The Pages CMS settings file (`.pages.yml`) was written from the Pages CMS documentation. I could not try it with the live service from here, so make one small test edit first. If the editor reports a settings error, send me the message and I will fix it.

## Part 3. Upload PDFs for download

1. In Pages CMS, open **PDF downloads list**. It already has a row for the whole plan, both appendices, and each of the 25 units.
2. Open a row, use the **PDF file** field to upload the PDF (or choose one already uploaded), and press Save.
3. Once a row has a file, the Download buttons appear automatically on the Downloads page, the Plan page, and that unit's page. Rows without a file show "Coming soon".

Name files plainly, such as `unit-08.pdf`.

## Part 4. Optional: your own web address

1. Buy a domain (Cloudflare Registrar or Namecheap, about $10 a year).
2. In the repository, open Settings, then Pages, and enter the domain under **Custom domain**. Follow GitHub's DNS instructions.
3. In Settings, then Secrets and variables, then Actions, then **Variables**, add `BASE_PATH` set to `/` and `SITE_URL` set to `https://your-domain.com`. Run the workflow again.

## Alternative host: Cloudflare Pages (free)

Connect the same repository in Cloudflare Pages with build command `npm run build`, output folder `dist`, and the environment variable `NODE_VERSION` set to `22`. Leave `BASE_PATH` unset. This host has no 1 GB size limit, which matters only if your PDFs grow very large.

## Limits and costs

- GitHub Pages sites can be up to 1 GB. The site is about 30 MB today. Unit PDFs will add to that.
- Traffic is soft-limited to 100 GB a month, which is plenty for a plan like this.
- Total cost: $0, plus the optional domain.

## What is on the site

- **Today:** a start date or "I am on Day N", the next four days, the memory verse of the week, and progress. Progress can be saved to a backup file and restored on another device.
- **Every day (900 pages):** all steps, a rail of steps, the unit's days on the left, previous and next with arrow keys, mark as finished, a text-size control and a night mode. Printing a day gives a clean page.
- **Each unit page:** anchor verse, how the Psalms are used in that unit, the days by week, the books read, and the PDF button.
- **From the appendices:**
  - The Plan at a Glance and anchor verses.
  - Doctrinal Pauses, filterable by topic.
  - Memory Verses in Order, with a practice mode that shows only first letters.
  - The Psalms guide, with a finder that lists every day reading each of the 150 psalms.
  - Weekly Checklist (interactive, printable, landscape).
  - Glossary with a filter.
  - 66 book pages, each with the days that read it, and every day page links to its books.
  - The author's note and "How to use this plan".
- **Search** across everything.

## A decision to make later: where the "real" text lives

Today your Word files are the source of record. After the site is live, the files in the `content` folder become the live text. If you edit in the online editor and also in Word, the two will drift apart. The script `scripts/export_content.py` rebuilds the content folder from your JSON and Word source files, **and it overwrites any edits made in the online editor**. Choose one place to edit, and tell me which, so I can build the other outputs (the Word and PDF files) from it.

## Working on it with Claude Code

In the project folder, run `npm install` once. Then `npm run dev` shows a live preview on your own computer, and `npm run build` makes the finished site in the `dist` folder. Claude Code can make any design change you ask for.

## Folder map

- `content/` days, units, books, pages, glossary, downloads, site wording
- `src/pages/` the page templates
- `src/styles/global.css` the classic look
- `public/js/app.js` progress, night mode, filters
- `public/downloads/` uploaded PDFs
- `.pages.yml` the online editor setup
- `.github/workflows/deploy.yml` the automatic publishing
- `scripts/export_content.py` the one-time export from your Word and JSON source


## Choosing the look

The site has two looks. Both use the rust accent (#8A4B16).

- **classic**: the cream, Garamond devotional style that matches the PDFs.
- **modern**: the original white, Inter and Source Serif style with pill buttons.

To switch, open Site Settings in the editor (or edit `content/site.json`) and set `look` to `classic` or `modern`. To preview the other look on any page without changing anything, add `?look=modern` or `?look=classic` to the address.
