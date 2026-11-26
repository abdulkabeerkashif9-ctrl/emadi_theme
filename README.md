# Emadi Theme

A standalone **UI/UX redesign app for Frappe Framework v15** (works alongside ERPNext and any custom app, e.g. `emadi_v3`).
It changes how the desk looks and feels and leaves what it does alone: no DocTypes, no overrides, no server code, no changes to Frappe/ERPNext core.

![Home](docs/screenshots/home-light-1440.png)

## What you get

| Area | Redesign |
| --- | --- |
| **Design system** | Corporate palette (navy `#142B49`, slate `#345477`, accent `#3478F6`), Inter typography scale, 4px spacing scale, 6–12px radius system, minimal elevation, focus rings. Every Frappe "espresso" variable is re-mapped, so core and ERPNext components inherit it. |
| **App rail** | New persistent left navigation (navy), built from the user's permitted workspaces (`frappe.boot.allowed_workspaces`). Icon mode with tooltips, or an expanded labelled mode (remembered per browser). Becomes an off-canvas drawer on tablets/phones. Highlights the module of the current document. |
| **Top bar** | Frosted sticky bar, refined breadcrumbs, wide search with keyboard hint, cleaner notifications panel and user menu. |
| **Home command-center** | Greeting + date banner, quick actions (Search, New To-Do, Calendar), live KPIs (open To-Dos, unread notifications, today's events) and *Recently viewed* documents. |
| **Workspaces** | Card-style shortcut, link, number (KPI) and chart widgets with hover states; modern module sidebar. |
| **List views** | Clean filter bar, sticky uppercase header, roomier rows, accent selected-row state, refined status pills, tabular numerals, paging. Also kanban, image, calendar and tree views. |
| **Forms** | Document sheet on a soft canvas, sticky animated tabs, generous sections, bordered inputs with focus rings, red required markers, read-only values, dashboard/connection cards, comment box and timeline. |
| **Child tables** | Bordered card grid, quiet header, hover/selected rows, borderless in-cell editing with focus ring, dashed "Add Row", red remove buttons. Grid widths/scroll logic untouched. |
| **Reports** | Summary cards, chart panel, styled DataTable (header, filters row, hover, totals row, tree/group rows, dropdowns). |
| **Components** | Buttons (primary/secondary/danger/link/icon), inputs, selects, checkboxes, radios, switches, date picker, autocomplete, dropdowns, popovers, tooltips, modals (entrance animation), toasts (status stripe), alerts, badges, avatars, skeleton shimmer, progress. |
| **Login** | Split-screen: brand panel with a subtle grid background on the left, clean form on the right (centred on mobile). Frappe's login form & auth flow are unchanged. |
| **Dark mode** | Full token set for `[data-theme="dark"]`. Use Frappe's built-in theme switcher (user menu → *Toggle Theme*, or the moon button in the rail). |
| **Accessibility & motion** | Visible keyboard focus, AA-level text contrast, `prefers-reduced-motion` respected, all animations are short CSS transitions. |

## Install

```bash
cd ~/frappe-bench
# Option A: from the zip
unzip emadi_theme.zip -d apps/
# Option B: from a git repo, if you push it to one
# bench get-app https://github.com/<you>/emadi_theme

bench pip install -e apps/emadi_theme      # registers the python package
echo "emadi_theme" >> sites/apps.txt        # only needed for Option A, if not already listed
bench build --app emadi_theme
bench --site <your-site> install-app emadi_theme
bench --site <your-site> clear-cache
bench restart                               # production (supervisor/nginx)
```

Then hard-refresh the browser (Ctrl+Shift+R).

### Uninstall / roll back

```bash
bench --site <your-site> uninstall-app emadi_theme
bench remove-app emadi_theme
bench build && bench --site <your-site> clear-cache
```

Nothing is stored in the database except the app's install record, so removal is clean.

> **Important:** if you previously replaced `apps/frappe/frappe/public` with the patched folder from earlier, restore the original
> (`cd apps/frappe && git checkout -- frappe/public && bench build --app frappe`). This app replaces that approach and does not need core edits.

## Build & deploy

Assets are standard Frappe v15 esbuild bundles:

| Hook (hooks.py) | Bundle |
| --- | --- |
| `app_include_css` | `public/scss/emadi_theme.bundle.scss` |
| `app_include_js` | `public/js/emadi_theme.bundle.js` |
| `web_include_css` | `public/scss/emadi_theme_web.bundle.scss` |
| `web_include_js` | `public/js/emadi_theme_web.bundle.js` |

After any change: `bench build --app emadi_theme && bench --site <site> clear-cache`.
During development: `bench watch` rebuilds on save.

## Customising

All design decisions live in `public/scss/_tokens.scss`:

* Brand: `--et-navy`, `--et-slate`, `--et-accent` (+ their dark-mode values)
* Surfaces/text/borders: `--et-bg`, `--et-surface`, `--et-text*`, `--et-border*`
* Shape & motion: `--et-r-*`, `--et-dur*`
* Layout: `--et-rail-w`, `--et-rail-w-open`, `--et-nav-h`

Login copy (headline and feature bullets) is in `public/js/emadi_theme_web.bundle.js`.
The rail brand name uses the default **Company** (`sysdefaults.company`); the logo uses *Navbar Settings → App Logo*.

## Files

```
emadi_theme/
├── pyproject.toml                    flit build, frappe >=15,<16
├── README.md, license.txt, .gitignore
├── docs/screenshots/*.png
└── emadi_theme/
    ├── __init__.py                   __version__
    ├── hooks.py                      asset hooks only
    ├── modules.txt, patches.txt
    ├── config/, templates/, emadi_theme/   (empty module scaffolding)
    └── public/
        ├── scss/
        │   ├── emadi_theme.bundle.scss        desk entry
        │   ├── emadi_theme_web.bundle.scss    website/login entry
        │   ├── _tokens.scss                   design tokens (light + dark) & Frappe re-map
        │   ├── desk/_base.scss                typography, focus, scrollbars, keyframes, reduced motion
        │   ├── desk/_navbar.scss              top bar, search, notifications
        │   ├── desk/_rail.scss                app rail, drawer, tooltips
        │   ├── desk/_page.scss                page head, actions, cards, skeletons, progress
        │   ├── desk/_sidebar.scss             workspace / list / form sidebars
        │   ├── desk/_components.scss          buttons, inputs, dropdowns, modals, toasts, badges, date picker…
        │   ├── desk/_workspace.scss           widgets + Home command-center
        │   ├── desk/_list.scss                list, filters, paging, kanban, calendar, tree
        │   ├── desk/_form.scss                tabs, sections, fields, dashboard, comments, timeline
        │   ├── desk/_grid.scss                child tables
        │   ├── desk/_report.scss              reports, summary, DataTable
        │   ├── desk/_responsive.scss          laptop / tablet / phone adaptations
        │   ├── web/_website.scss              portal & web forms
        │   └── web/_login.scss                split-screen auth
        └── js/
            ├── emadi_theme.bundle.js          desk entry (app_ready + route hooks)
            ├── emadi_theme/rail.js            app rail
            ├── emadi_theme/hero.js            Home command-center
            ├── emadi_theme/recent.js          recently viewed (localStorage)
            ├── emadi_theme/icons.js           inline icon set for theme chrome
            └── emadi_theme_web.bundle.js      login brand panel
```

## How it stays safe

* **No core edits, no class overrides, no monkey-patching.** JS only *adds* elements (rail, hero, search hint) and navigates with `frappe.set_route`, so permissions, route guards, keyboard shortcuts, realtime and client scripts behave as before.
* **Hero is inserted beside the workspace body**, never inside it, so Workspace editing/saving is untouched.
* **KPI counts** use `frappe.client.get_count` with `silent: true` on doctypes every user can read (ToDo, Notification Log, Event); a failure shows "—", never a dialog.
* **Recently viewed** is stored only in the browser (localStorage, per user).
* **Child tables:** only colours, borders and radii change. No widths, heights or scroll containers are altered, so grid.js measurements (including custom horizontal scroll) keep working.
* **CSS** is plain selectors on Frappe's documented template classes (`navbar.html`, `page.html`, `workspace.js`, list/form/grid templates), loaded after core. `!important` is used only where Frappe itself uses it.

## Testing performed

Rendered against Frappe v15's **original compiled desk/website/login CSS** and markup taken from v15 templates, with a mocked `frappe` JS API, in headless Chromium:

| Check | Result |
| --- | --- |
| SCSS compiles (Dart Sass) / JS bundles (esbuild, ES2019) | ✅ |
| Home workspace (light, dark, rail collapsed & expanded) | ✅ |
| List view with selection, pills, paging (1440 / 1280 / 390px) | ✅ |
| Form with tabs, sections, read-only & required fields, child table, comments/timeline (1440 / 820px, light & dark) | ✅ |
| Modal dialog over form (light & dark) | ✅ (fixed a z-index bug during testing) |
| Login split-screen | ✅ |
| Browser console errors from theme code | none |

**Not yet verified on a live site** (please check after install): saving/submitting/cancelling documents, link-field autocomplete, filter popovers, query reports with real data, print view, workspace edit mode, and every ERPNext/custom page. If something looks off, it's almost always a selector that needs a small tweak in one partial.

## Known limitations

* The rail lists **top-level** workspaces; child workspaces remain in Frappe's in-page workspace sidebar.
* KPIs on Home are generic (To-Dos, notifications, events). Business KPIs such as sales and production belong in Frappe **Number Cards** on the workspace, which this theme styles as KPI tiles.
* Pages with heavily custom HTML (custom Pages, third-party apps) inherit tokens/components but aren't individually designed.
* Print formats are intentionally untouched.
* `:has()` (selected-row highlight) needs a modern browser (Chrome/Edge 105+, Safari 15.4+, Firefox 121+); older browsers simply skip the highlight.
* RTL languages: layout works, but the rail stays on the left.
