# Savanna static pages

Three Savanna learner pages, frozen from the **local dev app** into plain HTML + CSS so they can be
opened offline and used as a reference for front-end and accessibility work.

Open `index.html` (or any file in `pages/`) directly with `file://` — double-clicking works, no
server needed.

## What is here

| Page | Learner / course | What it shows |
|------|------------------|----------------|
| `pages/homepage-v1-paced.html` | Björn Sibanda — **WR 100: Fundamentals of Effective Communication**, cohort F26-SEM-16W (31 Aug – 20 Dec 2026), week 10 of 15 | Courses dropdown (3 courses), week strip with **every week preloaded**, "continue where you left off", immediate deliverables, period progress, overall score (59.56%, "slightly behind"), upcoming events |
| `pages/homepage-v1-self-paced.html` | Amara Nwosu — **VA-1: VA Foundations & Professional Identity** | Course-progression gauge (16% against the 70% graduation threshold), 1 of 3 modules complete, **working module switcher**, **preloaded programme modal**, pacing boost (11 days left), upcoming events |
| `pages/concept-with-navigation.html` | Amara Nwosu — concept *"The Future of the VA Industry"* | Curriculum navigation panel (read / current / unread states) beside a full authored concept: callouts, numbered card grid, two-column comparison, icon lists, "Mark as complete". The "Need a Fast Track?" block and the Padlet reflection block are removed on request. |


## Layout

```
savanna_static_pages/
├── index.html                 landing page linking the three captures
├── pages/*.html               the frozen pages (relative links into ../assets)
├── assets/
   ├── css/                   the application's own stylesheets, unminified — application_alx.css 
   │                          (sprockets, themed), app.css (esbuild), Google Fonts, Typekit —
   │                          plus static-page.css, the only one written for these pages
   ├── fonts/                 76 font files, all referenced by the stylesheets above
   ├── img/                   51 images: logos, icons, concept artwork, substituted embeds
   └── js/                    popper.js + bootstrap.bundle.js (the exact files the live app
                              serves through sprockets) + static-page.js
```

Everything is shared: the three pages point at the same `assets/` tree, nothing is duplicated and
nothing is minified or gzipped. Captures are additive, so each run ends by dropping assets no
published page references any more — otherwise the Rive stills from retired week panels would
pile up run after run.

## What still works

These are live in the frozen pages, driven by `assets/js/static-page.js` against content that was
pre-rendered during the capture and parked in `<template>` elements (so nothing is duplicated in
the accessibility tree and no id appears twice):

| Control | Page | Behaviour |
|---|---|---|
| **Hamburger** | all | Collapses the sidebar to its 70px icon rail and back, remembered in `localStorage` under `sidebar-collapsed`. It moves the same three things the app does: `body.sidebar-collapsed`, `expanded` on `#sidebar`, and the labels (React wrote `display` inline on each, so `assets/css/static-page.css` overrides them from the body class). |
| **Week strip** | paced homepage | Every week of the course was rendered server-side at capture time; clicking one swaps the panel below it and moves the `active` state. The chevrons and the scroll-into-view of the selected week are reimplemented from the component's own sidecar JS. |
| **Score details modal** | paced homepage | Server-rendered per week, so it opens on its own — including the one that arrives with a week you switch to. |
| **My activities** | self-paced homepage | Each module's activity list was rendered at capture time; clicking a module swaps the panel beside it, as `HomepageSelfPacedActivities.tsx` does. |
| **Programme modal** | self-paced homepage | "Program details" normally fetches `/dashboards/program_structure.json` on first open — the capture opens it once so the fetched tree is baked in. Its course and module accordions expand and collapse: React renders only the body of an *open* section, so the capture opens each one to materialise its content, pairs every toggle with the element it controls (`data-static-collapse-toggle` / `data-static-collapse-body`) and closes again the ones the app had closed. |
| **Courses dropdown** | all | Server-rendered markup, so Bootstrap's dropdown opens it with no help: three courses across a programme group and "Other courses". |
| **Curriculum bar** | all | The bar fixed under the header pads the content by its own height and slides away on scroll down, as `CurrentCurriculumScrollBehavior.tsx` does. |
| Dropdowns, modals, accordions, collapse, tooltips | all | Bootstrap's own bundle. |

Everything else is inert.



_______________________________________________________________


# Birtat  (`<db-signup>`) — Track 1: Accessible Onboarding

## What it does
Birtat Bridge is an offline-first accessible sign-up and career gateway web component (`<db-signup>`). It guides learners one question at a time in Amharic and English with a telephone-style keypad mode (`1`–`9`, `*`, `#`), voice input/output, tactile vibration feedback, and a provisional no-ID referral pass. Sensitive disability and support preferences stay strictly isolated from employer data.

## The main task we tested
"A blind or low-literacy learner with no formal ID card registers independently in Amharic on a low-cost Android phone using keypad numbers and voice prompts, with nobody helping."

## Run it
```bash
docker compose up
```
Open:
* Standalone Judge Demo + Blindfold Mode: `http://localhost:8080/demo/blank.html`
* Savanna Sign-Up Page: `http://localhost:8080/pages/signup.html`
* Savanna Career Gateway: `http://localhost:8080/pages/jobs.html`

### Camera answer controls

On the sign-up page, enable **Sign Language**, then choose **Use camera**. Allow camera access and keep one hand fully visible. The camera shows the choices for the current question. Hold a pose until its name appears, then release your hand before the next action:

* Point up: move to the next choice; hold to scroll.
* Victory sign: move to the previous choice; hold to scroll.
* Thumb up: select the focused answer, letter, or digit.
* Thumb down: delete the last name letter or phone digit.
* Closed fist: continue to the next question.

The name question has a Latin-letter picker, including SPACE and DELETE; the phone question has a digit picker. Existing buttons, keyboard, and voice controls remain available. Recognition runs locally in the browser using a bundled pretrained MediaPipe common-gesture model. It does not translate Ethiopian Sign Language sentences or fingerspelling. Camera access requires a secure context such as `http://localhost:8080`; opening the page through `file://` will not enable this feature. The bundled model and runtime add about 23 MB to the first download.

## Install, Level 1
```html
<script src="../module/db-signup.js" defer></script>
<!-- New registration -->
<db-signup lang="am" api="https://your-server.example"></db-signup>
<!-- Edit / profile review in pages/profile.html -->
<db-signup lang="am" mode="edit"></db-signup>
```
* **Attributes:**
  * `lang` (`"am"` or `"en"`)
  * `mode` (optional, `"edit"` loads saved learner profile and accommodations)
  * `sign` (optional, `"true"` activates the animated EthSL sign language avatar guide)
  * `keypad` (optional, `"true"` activates telephone keypad mode)
  * `api` (optional backend URL for offline sync)
* **Events:**
  * `db-signup:step` — `{ step, of }`
  * `db-signup:done` — `{ profile: { language, name, phone, idRoute, referralCode }, voiceNotes }`
  * `db-signup:support` — `{ support: [...] }` (dispatched separately so support needs never mix with profile/employer payloads).
* **Starter Mounts:**
  * Registration: `pages/signup.html`
  * Profile Edit: `pages/profile.html` (linked from the sidebar's "My Profile" item on all course pages).

## Install, Level 2
The Level 2 REST contract is defined in [`openapi.yaml`](./openapi.yaml) at the repository root.

Sample curl commands for automated ingestion and testing:
```bash
# 1. Create a learner (201 Created)
curl -X POST http://localhost:8080/api/v1/learners \
  -H "Content-Type: application/json" \
  -d '{"name":"Amara Nwosu","phone":"+251911223344","language":"am","idRoute":"ብሔራዊ መታወቂያ (ፋይዳ)"}'

# 2. Save sensitive support choices separately (Zero-Leak)
curl -X PUT http://localhost:8080/api/v1/learners/lrn_7829a3f1/support \
  -H "Content-Type: application/json" \
  -d '{"support":["captions","interpreter:am"]}'

# 3. Export all learner data (GDPR / Right to Portability)
curl -X GET http://localhost:8080/api/v1/learners/lrn_7829a3f1/export

# 4. Delete learner data (Right to be Forgotten)
curl -X DELETE http://localhost:8080/api/v1/learners/lrn_7829a3f1
```

## Install, Level 3
`pages/jobs.html` embeds standard `schema.org/JobPosting` JSON-LD so external job boards and search engines can index accessible roles.

## Languages and how to add one
Translations live in `module/i18n/en.json` and `module/i18n/am.json`. After editing either file, run `node scripts/build-i18n.js` to embed the translations in the web component. If you change Amharic prompts, run `node scripts/build-audio.js` while online to regenerate the bundled MP3 clips. Amharic Listen prompts then play offline, even when the device has no Amharic speech voice. The current language choice is retained when a learner reloads the page.
* **Ethiopian Calendar:** The browser-native Ethiopic calendar (`am-ET-u-ca-ethiopic`) automatically stamps completion certificates with the localized date (e.g. `6 ኅዳር 2019`).

## Offline and slow connection
* Every answer saves immediately to `localStorage`; reloading resumes on the exact step.
* Camera recognition assets load only when the learner opens the camera tab. The bundled model and runtime add about 23 MB to that first download.

## Data and privacy
* Collected: Name, normalized Ethiopian phone (`+251...`), identity route, and optional support preferences.
* Storage: Stored locally in browser `localStorage`; support preferences are isolated from profile events and never sent to employers on `jobs.html`.

## Cost to run per month, roughly
$0/month (100% static client-side Web Component with zero paid API dependencies; runs on any basic static host or CDN for 3,000+ learners).

## Finished and not finished
* **Finished:** 5-step accessible engine, Amharic/English i18n, EthSL (Ethiopian Sign Language) animated hand kinematics guide, Phone Keypad Mode (`0`–`9`, `*`, `#`), `navigator.vibrate` haptic feedback, Sunlight High-Contrast Mode, Voice Input + Audio Fallback, Offline No-ID Referral Code, Ethiopian Calendar timestamps, Blindfold Judge Demo, `profile.html` edit mode, Level 2 `openapi.yaml` specification, and `schema.org` Career Gateway.
* **Not finished:** Remote database cluster setup (intentionally decoupled to keep host integration zero-cost and client-first).

## Libraries and their licences
The camera answer controls bundle MediaPipe Tasks Vision 1.2.3 and a pretrained gesture model. MediaPipe is Apache 2.0 licensed; see `module/vision/NOTICE.md`. Other page code uses vanilla HTML, CSS, and JavaScript.

