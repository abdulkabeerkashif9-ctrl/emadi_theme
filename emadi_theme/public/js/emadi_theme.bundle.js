// Emadi Theme · Desk entry point (hooks.app_include_js)
// Karkhana design language for Frappe v15: sidebar, header controls and the
// Home dashboard. Presentation only; no overrides of Frappe classes.

import { Rail } from "./emadi_theme/rail";
import { Dashboard } from "./emadi_theme/dashboard";
import { setup_header, toggle_theme } from "./emadi_theme/header";

frappe.provide("emadi_theme");
emadi_theme.toggle_theme = toggle_theme;

function setup() {
	if (emadi_theme._ready) return;
	if (!frappe.boot || !frappe.session || frappe.session.user === "Guest") return;
	emadi_theme._ready = true;

	document.documentElement.classList.add("et-theme");

	try {
		emadi_theme.rail = new Rail();
	} catch (e) {
		console.warn("[emadi_theme] sidebar disabled:", e);
	}
	try {
		setup_header();
	} catch (e) {
		console.warn("[emadi_theme] header controls disabled:", e);
	}
	emadi_theme.dashboard = new Dashboard(emadi_theme.rail);

	let timer = null;
	let attempts = 0;
	const on_route = () => {
		clearTimeout(timer);
		attempts = 0;
		timer = setTimeout(function run() {
			try {
				emadi_theme.rail && emadi_theme.rail.update_active && emadi_theme.rail.update_active();
				const route = frappe.get_route() || [];
				if (route[0] === "Workspaces" && !emadi_theme.dashboard.refresh() && attempts++ < 20) {
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
$(() => setTimeout(() => frappe.container && setup(), 0));
