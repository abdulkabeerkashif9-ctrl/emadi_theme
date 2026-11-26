// Persistent application rail built from frappe.boot.allowed_workspaces.
// Navigation goes through frappe.set_route, so permissions, routing hooks and
// keyboard shortcuts behave exactly as with Frappe's own sidebar.

import { icons } from "./icons";

const EXPANDED_KEY = "et_rail_expanded";
const LAST_WS_KEY = "et_rail_last_workspace";

const slug = (s) => frappe.router.slug(s || "");
const esc = (s) => frappe.utils.escape_html(String(s ?? ""));

function storage_get(store, key) {
	try {
		return store.getItem(key);
	} catch (e) {
		return null;
	}
}

function storage_set(store, key, value) {
	try {
		store.setItem(key, value);
	} catch (e) {
		/* ignore */
	}
}

export class Rail {
	constructor() {
		this.workspaces = this.get_workspaces();
		if (!this.workspaces.public.length && !this.workspaces.private.length) return;

		this.render();
		this.bind();
		this.restore_state();
		this.update_active();
	}

	get_workspaces() {
		const all = (frappe.boot.allowed_workspaces || []).filter(
			(w) => w && w.name && !w.parent_page && !cint(w.is_hidden)
		);
		const is_public = (w) => w.public === undefined || cint(w.public) === 1;
		const to_item = (w) => ({
			name: w.name,
			title: w.title || w.name,
			icon: w.icon,
			module: w.module,
			route: slug(is_public(w) ? w.name : "private/" + w.name),
			key: slug(w.name),
		});
		return {
			public: all.filter(is_public).map(to_item),
			private: all.filter((w) => !is_public(w)).map(to_item),
		};
	}

	icon_html(item) {
		try {
			if (item.icon) return frappe.utils.icon(item.icon, "md");
		} catch (e) {
			/* fall through */
		}
		return icons.folder(20);
	}

	item_html(item) {
		const label = esc(__(item.title));
		return `
			<a class="et-rail__item" href="/app/${esc(item.route)}" data-route="${esc(item.route)}"
				data-key="${esc(item.key)}" data-label="${label}" aria-label="${label}">
				<span class="et-rail__icon">${this.icon_html(item)}</span>
				<span class="et-rail__label">${label}</span>
			</a>`;
	}

	brand() {
		const logo = frappe.boot.app_logo_url;
		const name =
			(frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) ||
			frappe.boot.app_name ||
			__("Workspace");
		return { logo, name };
	}

	render() {
		const { logo, name } = this.brand();
		const pub = this.workspaces.public.map((w) => this.item_html(w)).join("");
		const priv = this.workspaces.private.map((w) => this.item_html(w)).join("");

		this.$rail = $(`
			<nav class="et-rail" aria-label="${esc(__("Main navigation"))}">
				<a class="et-rail__brand" href="/app" aria-label="${esc(__("Home"))}">
					<span class="et-rail__logo">${
						logo ? `<img src="${esc(logo)}" alt="">` : icons.home(18)
					}</span>
					<span class="et-rail__brand-text">
						<span class="et-rail__brand-name">${esc(name)}</span>
						<span class="et-rail__brand-sub">${esc(__("ERP Suite"))}</span>
					</span>
				</a>
				<div class="et-rail__scroll">
					<div class="et-rail__group-label">${esc(__("Modules"))}</div>
					${pub}
					${
						priv
							? `<div class="et-rail__group-label">${esc(__("My Workspaces"))}</div>${priv}`
							: ""
					}
				</div>
				<div class="et-rail__footer">
					<button type="button" class="et-rail__item et-rail__theme" data-label="${esc(
						__("Switch Theme")
					)}">
						<span class="et-rail__icon">${icons.moon(20)}</span>
						<span class="et-rail__label">${esc(__("Appearance"))}</span>
					</button>
					<button type="button" class="et-rail__item et-rail__toggle" data-label="${esc(
						__("Expand")
					)}" aria-expanded="false">
						<span class="et-rail__icon">${icons.chevrons(20)}</span>
						<span class="et-rail__label">${esc(__("Collapse"))}</span>
					</button>
				</div>
			</nav>
		`);

		this.$backdrop = $(`<div class="et-rail-backdrop" aria-hidden="true"></div>`);
		$("body").append(this.$rail, this.$backdrop).addClass("et-has-rail");

		// Mobile opener in the navbar
		const $nav_container = $(".navbar > .container").first();
		if ($nav_container.length && !$nav_container.find(".et-rail-mobile-btn").length) {
			this.$mobile_btn = $(
				`<button type="button" class="et-rail-mobile-btn" aria-label="${esc(
					__("Open navigation")
				)}">${icons.menu(20)}</button>`
			).prependTo($nav_container);
		}
	}

	bind() {
		this.$rail.on("click", ".et-rail__item[data-route]", (e) => {
			// Let the browser handle new-tab / middle clicks
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			const route = $(e.currentTarget).attr("data-route");
			frappe.set_route(route);
			this.close_drawer();
		});

		this.$rail.on("click", ".et-rail__toggle", () => this.toggle_expanded());

		this.$rail.on("click", ".et-rail__theme", () => {
			if (frappe.ui.ThemeSwitcher) {
				new frappe.ui.ThemeSwitcher().show();
			}
			this.close_drawer();
		});

		this.$backdrop.on("click", () => this.close_drawer());
		this.$mobile_btn && this.$mobile_btn.on("click", () => this.open_drawer());

		$(document).on("keydown.et-rail", (e) => {
			if (e.key === "Escape" && $("body").hasClass("et-rail-open")) this.close_drawer();
		});
	}

	restore_state() {
		const expanded = storage_get(localStorage, EXPANDED_KEY) === "1";
		this.set_expanded(expanded);
	}

	set_expanded(expanded) {
		$("body").toggleClass("et-rail-expanded", expanded);
		this.$rail
			.find(".et-rail__toggle")
			.attr("aria-expanded", expanded ? "true" : "false")
			.attr("data-label", expanded ? __("Collapse") : __("Expand"));
		storage_set(localStorage, EXPANDED_KEY, expanded ? "1" : "0");
		// Datatables / charts measure their container: let them re-layout
		setTimeout(() => window.dispatchEvent(new Event("resize")), 280);
	}

	toggle_expanded() {
		this.set_expanded(!$("body").hasClass("et-rail-expanded"));
	}

	open_drawer() {
		$("body").addClass("et-rail-open");
	}

	close_drawer() {
		$("body").removeClass("et-rail-open");
	}

	find_by_key(key) {
		return [...this.workspaces.public, ...this.workspaces.private].find((w) => w.key === key);
	}

	find_by_module(module) {
		if (!module) return null;
		const all = [...this.workspaces.public, ...this.workspaces.private];
		return all.find((w) => w.module === module) || all.find((w) => w.title === module) || null;
	}

	resolve_active_key() {
		const route = frappe.get_route() || [];

		if (route[0] === "Workspaces") {
			const name = route[1] === "private" ? route[2] : route[1];
			if (name) return slug(name);
			const first = this.workspaces.public[0] || this.workspaces.private[0];
			return first && first.key;
		}

		// Ask Frappe's breadcrumbs which workspace this page belongs to
		try {
			const bc = frappe.breadcrumbs.all[frappe.breadcrumbs.current_page()];
			if (bc) {
				if (bc.workspace && this.find_by_key(slug(bc.workspace))) return slug(bc.workspace);
				const by_module = this.find_by_module(bc.module);
				if (by_module) return by_module.key;
			}
		} catch (e) {
			/* breadcrumbs not ready */
		}

		const doctype = ["Form", "List", "Report", "Tree"].includes(route[0]) ? route[1] : null;
		if (doctype && window.locals && locals.DocType && locals.DocType[doctype]) {
			const by_module = this.find_by_module(locals.DocType[doctype].module);
			if (by_module) return by_module.key;
		}

		return storage_get(sessionStorage, LAST_WS_KEY);
	}

	update_active() {
		if (!this.$rail) return;
		const key = this.resolve_active_key();
		this.$rail.find(".et-rail__item.is-active").removeClass("is-active").removeAttr("aria-current");
		if (!key) return;
		const $item = this.$rail.find(`.et-rail__item[data-key="${CSS.escape(key)}"]`);
		if ($item.length) {
			$item.addClass("is-active").attr("aria-current", "page");
			storage_set(sessionStorage, LAST_WS_KEY, key);
		}
	}

	is_home(key) {
		const first = this.workspaces.public[0] || this.workspaces.private[0];
		return key === "home" || (first && key === first.key);
	}
}
