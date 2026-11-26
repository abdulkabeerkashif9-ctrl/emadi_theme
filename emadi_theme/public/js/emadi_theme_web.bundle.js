// Emadi Theme · Website entry point (hooks.web_include_js)
// Adds a brand panel to the auth pages. Login form, fields, IDs and the
// authentication flow (frappe/www/login.html + login.js) are untouched.

(function () {
	const AUTH_PATHS = ["login", "update-password"];

	const esc = (s) =>
		String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

	const tick =
		'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

	function brand_name(head) {
		const h4 = head && head.querySelector("h4");
		const text = h4 ? h4.textContent.trim() : "";
		// "Login to Acme" → "Acme"
		const m = text.match(/(?:login|log in|sign in)\s+to\s+(.+)$/i);
		return (m && m[1]) || document.title.replace(/^\s*login\s*[-|·]?\s*/i, "") || "ERP";
	}

	function build() {
		const path = (document.body.dataset.path || "").replace(/^\//, "");
		const has_auth_markup = document.querySelector(".for-login, .for-forgot, .for-signup");
		if (!AUTH_PATHS.includes(path) && !has_auth_markup) return;
		if (document.querySelector(".et-auth-aside")) return;

		document.body.classList.add("et-auth");

		const head = document.querySelector(".for-login .page-card-head") || document.querySelector(".page-card-head");
		const logo_el = head && head.querySelector("img");
		const logo = logo_el ? logo_el.getAttribute("src") : "";
		const name = brand_name(head);

		// Friendly sub-heading under each auth form title
		document.querySelectorAll(".page-card-head").forEach((h) => {
			if (h.querySelector(".et-auth-sub")) return;
			const sub = document.createElement("div");
			sub.className = "et-auth-sub";
			const section = h.closest("section, div[class^='for-']");
			const cls = section ? section.className : "";
			sub.textContent = /forgot/.test(cls)
				? "Enter your email and we'll send you a reset link."
				: /signup/.test(cls)
				? "Create your account to get started."
				: "Welcome back. Sign in to continue to your workspace.";
			h.appendChild(sub);
		});

		const year = new Date().getFullYear();
		const aside = document.createElement("aside");
		aside.className = "et-auth-aside";
		aside.setAttribute("aria-hidden", "true");
		aside.innerHTML = `
			<div class="et-auth-brand">
				<span class="et-auth-brand__logo">${logo ? `<img src="${esc(logo)}" alt="">` : ""}</span>
				<span>${esc(name)}</span>
			</div>
			<div class="et-auth-copy">
				<span class="et-auth-copy__eyebrow"><i></i> Enterprise Resource Planning</span>
				<h2>One platform for operations, finance and production.</h2>
				<p>Plan, produce, sell and account in a single, connected system built for the way your business runs.</p>
				<ul class="et-auth-features">
					<li><span class="et-tick">${tick}</span><div><strong>Production &amp; operations</strong><small>Contracts, receipts and shop-floor tracking</small></div></li>
					<li><span class="et-tick">${tick}</span><div><strong>Procurement &amp; inventory</strong><small>Requests, purchase orders and stock in real time</small></div></li>
					<li><span class="et-tick">${tick}</span><div><strong>Sales &amp; accounting</strong><small>Orders, invoicing and financial reporting</small></div></li>
				</ul>
			</div>
			<div class="et-auth-foot">
				<span>© ${year} ${esc(name)}</span>
				<span>Secure sign-in</span>
			</div>`;
		document.body.prepend(aside);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", build);
	} else {
		build();
	}
})();
