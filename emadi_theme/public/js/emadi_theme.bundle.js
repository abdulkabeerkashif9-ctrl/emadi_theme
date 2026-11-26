// Emadi Theme · Desk entry point (hooks.app_include_js)
// Purely presentational: adds the navigation rail, the Home command-center
// and a search keyboard hint. No business logic, no overrides of Frappe
// classes, no server writes.

import { Rail } from "./emadi_theme/rail";
import { Hero } from "./emadi_theme/hero";
import { track_current_route } from "./emadi_theme/recent";

frappe.provide("emadi_theme");

function enhance_search() {
	const $bar = $(".navbar .search-bar").first();
	if (!$bar.length || $bar.find(".et-kbd-hint").length) return;
	const mod = frappe.utils.is_mac() ? "⌘" : "Ctrl";
	$bar.append(`<span class="et-kbd-hint" aria-hidden="true"><kbd>${mod}</kbd><kbd>G</kbd></span>`);
	$bar.find("#navbar-search").attr("placeholder", __("Search or type a command"));
}

function setup() {
	if (emadi_theme._ready) return;
	if (!frappe.boot || !frappe.session || frappe.session.user === "Guest") return;
	emadi_theme._ready = true;

	document.documentElement.classList.add("et-theme");

	try {
		emadi_theme.rail = new Rail();
	} catch (e) {
		console.warn("[emadi_theme] rail disabled:", e);
	}
	emadi_theme.hero = new Hero(emadi_theme.rail);

	enhance_search();

	let timer = null;
	let attempts = 0;
	const on_route = () => {
		clearTimeout(timer);
		attempts = 0;
		timer = setTimeout(function run() {
			try {
				track_current_route();
				emadi_theme.rail && emadi_theme.rail.update_active && emadi_theme.rail.update_active();
				const route = frappe.get_route() || [];
				// Workspace DOM is built async: retry briefly until it exists
				if (route[0] === "Workspaces" && !emadi_theme.hero.refresh() && attempts++ < 20) {
					timer = setTimeout(run, 150);
				}
			} catch (e) {
				console.warn("[emadi_theme]", e);
			}
		}, 60);
	};

	frappe.router && frappe.router.on && frappe.router.on("change", on_route);
	$(document).on("page-change", on_route);
	on_route();
}

$(document).on("app_ready", setup);
// In case this bundle loads after app_ready already fired
$(() => setTimeout(() => frappe.container && setup(), 0));
