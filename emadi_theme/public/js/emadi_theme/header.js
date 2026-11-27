// Karkhana header controls added to Frappe's navbar:
// "+ Create" menu, light/dark toggle and the company button.
// They only call Frappe APIs (new_doc, switch_theme, set_route).

import { icon } from "./lucide";
import { allowed_quick_create, initials } from "./brand";

const esc = (s) => frappe.utils.escape_html(String(s ?? ""));

export function toggle_theme() {
	const root = document.documentElement;
	const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
	root.setAttribute("data-theme-mode", next);
	if (frappe.ui.set_theme) frappe.ui.set_theme();
	else root.setAttribute("data-theme", next);
	frappe.xcall("frappe.core.doctype.user.user.switch_theme", {
		theme: next === "dark" ? "Dark" : "Light",
	});
}

export function setup_header() {
	const $navbar = $(".navbar").first();
	if (!$navbar.length || $navbar.find(".k-header-actions").length) return;

	// Search: keyboard hint + shorter placeholder
	const $bar = $navbar.find(".search-bar").first();
	if ($bar.length && !$bar.find(".et-kbd-hint").length) {
		const mod = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		$bar.append(`<span class="et-kbd-hint" aria-hidden="true"><kbd>${mod} G</kbd></span>`);
		$bar.find("#navbar-search").attr("placeholder", __("Search…"));
	}

	// + Create (dropdown of quick creates)
	const actions = allowed_quick_create();
	const $actions = $(`<div class="k-header-actions"></div>`);
	if (actions.length) {
		const $create = $(`
			<div class="dropdown">
				<button type="button" class="btn btn-primary btn-sm k-create" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
					${icon("plus", 15, 2)}<span class="k-create-label">${esc(__("Create"))}</span>
				</button>
				<div class="dropdown-menu dropdown-menu-right" role="menu">
					${actions
						.map(
							(a) =>
								`<button type="button" class="dropdown-item" data-doctype="${esc(a.doctype)}">${icon(
									a.icon,
									15
								)}<span class="menu-item-label">${esc(__(a.label))}</span></button>`
						)
						.join("")}
				</div>
			</div>`);
		$create.on("click", "[data-doctype]", (e) => frappe.new_doc($(e.currentTarget).attr("data-doctype")));
		$actions.append($create);
	}
	const $form = $navbar.find("form[role='search']").first();
	if ($form.length) $form.after($actions);

	// Theme toggle + company, placed before the avatar
	const $user_li = $navbar.find(".dropdown-navbar-user").first();
	const company = frappe.boot.sysdefaults && frappe.boot.sysdefaults.company;
	const $theme = $(`
		<li class="nav-item">
			<button type="button" class="k-ghost-icon k-theme-toggle" aria-label="${esc(__("Toggle theme"))}">
				<span class="k-icon-moon">${icon("moon", 16, 2)}</span>
				<span class="k-icon-sun">${icon("sun", 16, 2)}</span>
			</button>
		</li>`);
	$theme.on("click", "button", toggle_theme);
	$user_li.before($theme);

	if (company) {
		const $company = $(`
			<li class="nav-item k-company d-none d-md-flex">
				<button type="button" class="btn btn-default btn-sm" title="${esc(company)}">
					${icon("building-complex", 15)}<span>${esc(initials(company))}</span>${icon("chevron-down", 14)}
				</button>
			</li>`);
		$company.on("click", "button", () => frappe.set_route("Form", "Company", company));
		$user_li.before($company);
	}
}
