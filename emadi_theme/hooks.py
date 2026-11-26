app_name = "emadi_theme"
app_title = "Emadi Theme"
app_publisher = "Emadi"
app_description = "Premium corporate UI/UX theme for Frappe Framework v15"
app_email = "admin@example.com"
app_license = "mit"

# ---------------------------------------------------------------------------
# UI-only app: no DocTypes, no business logic, no overrides.
# Everything is injected through Frappe's supported asset hooks and built
# by `bench build` (esbuild bundles from public/**/*.bundle.*).
# ---------------------------------------------------------------------------

# Desk (/app)
app_include_css = ["emadi_theme.bundle.css"]
app_include_js = ["emadi_theme.bundle.js"]

# Website pages (login, portal, web forms)
web_include_css = ["emadi_theme_web.bundle.css"]
web_include_js = ["emadi_theme_web.bundle.js"]
