// Emadi Theme · Website entry point (hooks.web_include_js)
// Karkhana login: brand row, artwork panel and copy. Frappe's login form,
// field IDs and authentication (frappe/www/login.html + login.js) are untouched.

import { LOGO } from "./emadi_theme/lucide";
import { BRAND } from "./emadi_theme/brand";

const AUTH_PATHS = ["login", "update-password"];

const esc = (s) =>
	String(s ?? "").replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
	);

// Arcs: same geometry as the Karkhana reference (viewBox 600×760)
const ARTWORK = `
<svg viewBox="0 0 600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
	<defs><pattern id="k-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--k-side-line)" stroke-width="1"></path></pattern></defs>
	<rect width="600" height="760" fill="url(#k-grid)"></rect>
	<path class="k-arc" pathLength="1" d="M600 160A400 400 0 0 0 200 560" fill="none" stroke="var(--k-gold)" stroke-width="1.2" stroke-opacity="0.25"></path>
	<path class="k-arc" pathLength="1" d="M600 240A320 320 0 0 0 280 560" fill="none" stroke="var(--k-gold)" stroke-width="1.2" stroke-opacity="0.4"></path>
	<path class="k-arc" pathLength="1" d="M600 320A240 240 0 0 0 360 560" fill="none" stroke="var(--k-gold)" stroke-width="1.2" stroke-opacity="0.55"></path>
	<path class="k-arc" pathLength="1" d="M600 400A160 160 0 0 0 440 560" fill="none" stroke="var(--k-gold)" stroke-width="1.2" stroke-opacity="0.7"></path>
	<path class="k-arc" pathLength="1" d="M600 480A80 80 0 0 0 520 560" fill="none" stroke="var(--k-gold)" stroke-width="1.2" stroke-opacity="0.85"></path>
	<rect x="440" y="560" width="160" height="80" fill="var(--k-gold)" fill-opacity="0.9"></rect>
	<rect x="360" y="560" width="80" height="40" fill="var(--k-sage)" fill-opacity="0.8"></rect>
	<path d="M200 560H600M600 160V640" stroke="var(--k-gold)" stroke-opacity="0.4"></path>
	<circle cx="440" cy="400" r="5" fill="var(--k-gold)"></circle>
</svg>`;

const ARROW =
	'<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';

function build() {
	const path = (document.body.dataset.path || "").replace(/^\//, "");
	const has_auth = document.querySelector(".for-login, .for-forgot, .for-signup");
	if (!AUTH_PATHS.includes(path) && !has_auth) return;
	if (document.querySelector(".k-auth-aside")) return;

	document.body.classList.add("et-auth");

	// Login heading + sub-heading (other auth panels keep their own title)
	const login_head = document.querySelector(".for-login .page-card-head");
	if (login_head) {
		const h4 = login_head.querySelector("h4");
		if (h4) h4.textContent = "Welcome back";
	}
	document.querySelectorAll(".page-card-head").forEach((h) => {
		if (h.querySelector(".k-auth-sub")) return;
		const section = h.closest("section, div[class^='for-']");
		const cls = section ? section.className : "";
		const sub = document.createElement("p");
		sub.className = "k-auth-sub";
		sub.textContent = /forgot/.test(cls)
			? "Enter your email and we'll send you a reset link."
			: /signup/.test(cls)
			? "Create your account to get started."
			: "Sign in to run your business from one place.";
		h.appendChild(sub);
	});

	// Field labels
	const email_label =
		document.querySelector(".for-login label[for='login_email']") ||
		document.querySelector(".for-login .page-card-body .form-group label");
	if (email_label) email_label.textContent = "Work email";

	// "Login" → "Sign in →"
	const btn = document.querySelector(".for-login .btn-login");
	if (btn && !btn.querySelector("svg")) btn.innerHTML = `Sign in${ARROW}`;

	const brand = document.createElement("div");
	brand.className = "k-auth-brand";
	brand.innerHTML = `${LOGO}<span>${esc(BRAND.NAME)}</span>`;

	const foot = document.createElement("p");
	foot.className = "k-auth-foot";
	foot.textContent = `${BRAND.NAME} ERP`;

	const aside = document.createElement("aside");
	aside.className = "k-auth-aside";
	aside.setAttribute("aria-hidden", "true");
	aside.innerHTML = `${ARTWORK}<div class="k-auth-copy"><p>${esc(BRAND.TAGLINE)}</p><p>${esc(
		BRAND.SUBLINE
	)}</p></div>`;

	document.body.prepend(brand, foot, aside);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
else build();
