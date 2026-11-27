// Karkhana-style sidebar built from frappe.boot.allowed_workspaces.
// Workspaces are grouped (Overview, Business, Operations, Finance, People,
// Administration) by name; anything unknown goes under "Modules".
// Navigation uses frappe.set_route, so permissions and routing are Frappe's.

import { icon, LOGO } from "./lucide";
import { BRAND, initials } from "./brand";

const COLLAPSED_KEY = "et_rail_collapsed";
const LAST_WS_KEY = "et_rail_last_workspace";

const slug = (s) => frappe.router.slug(s || "");
const esc = (s) => frappe.utils.escape_html(String(s ?? ""));

const GROUPS = [
	["overview", "Overview"],
	["business", "Business"],
	["operations", "Operations"],
	["modules", "Modules"],
	["finance", "Finance"],
	["people", "People"],
	["analytics", "Analytics"],
	["admin", "Administration"],
];

// exact workspace name → [group, icon]
const KNOWN = {
	home: ["overview", "layout-dashboard"],
	selling: ["business", "trending-up"],
	crm: ["business", "target"],
	buying: ["business", "shopping-cart"],
	stock: ["operations", "boxes"],
	manufacturing: ["operations", "factory"],
	subcontracting: ["operations", "truck"],
	projects: ["operations", "folder-kanban"],
	quality: ["operations", "shield-check"],
	assets: ["operations", "building-complex"],
	support: ["operations", "headset"],
	accounting: ["finance", "book-open"],
	payables: ["finance", "receipt-text"],
	receivables: ["finance", "credit-card"],
	"financial-reports": ["finance", "file-spreadsheet"],
	banking: ["finance", "landmark"],
	hr: ["people", "contact"],
	"human-resources": ["people", "contact"],
	payroll: ["people", "wallet"],
	"leaves": ["people", "plane"],
	attendance: ["people", "calendar-check"],
	"insights": ["analytics", "chart-line"],
	users: ["admin", "user-cog"],
	tools: ["admin", "wrench"],
	website: ["admin", "globe"],
	build: ["admin", "blocks"],
	integrations: ["admin", "workflow"],
	"erpnext-integrations": ["admin", "workflow"],
	"erpnext-settings": ["admin", "settings-2"],
	settings: ["admin", "settings-2"],
};

// keyword fallbacks for custom workspaces
const KEYWORDS = [
	[/dye|chemical|lab/i, "flask-conical"],
	[/weav|sizing|loom|stitch|hemm|cut|production|knit|spin|factory|mill/i, "factory"],
	[/sale|order|quotation/i, "trending-up"],
	[/purchas|procure|buy|supplier/i, "shopping-cart"],
	[/stock|inventory|warehouse|store/i, "boxes"],
	[/account|ledger|finance|invoice/i, "book-open"],
	[/payment|bank|cash/i, "credit-card"],
	[/report|analytic|insight/i, "files"],
	[/employee|hr|staff|people/i, "contact"],
	[/setting|setup|config/i, "settings-2"],
	[/cost/i, "receipt-text"],
];

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
		this.items = this.get_items();
		if (!this.items.length) return;
		this.render();
		this.bind();
		this.set_collapsed(storage_get(localStorage, COLLAPSED_KEY) === "1", true);
		this.update_active();
	}

	get_items() {
		const all = (frappe.boot.allowed_workspaces || []).filter(
			(w) => w && w.name && !w.parent_page && !cint(w.is_hidden)
		);
		const is_public = (w) => w.public === undefined || cint(w.public) === 1;
		return all.map((w) => {
			const key = slug(w.name);
			let [group, ic] = KNOWN[key] || [];
			if (!group) {
				group = is_public(w) ? "modules" : "modules";
				const kw = KEYWORDS.find(([re]) => re.test(w.name));
				ic = kw ? kw[1] : "folder";
			}
			return {
				name: w.name,
				title: w.title || w.name,
				module: w.module,
				group,
				icon: ic,
				key,
				route: slug(is_public(w) ? w.name : "private/" + w.name),
			};
		});
	}

	item_html(item) {
		const label = esc(__(item.title));
		return `<a class="et-rail__item" href="/app/${esc(item.route)}" data-route="${esc(
			item.route
		)}" data-key="${esc(item.key)}" data-label="${label}">
			<span class="et-rail__icon">${icon(item.icon, 16, 1.6)}</span>
			<span class="et-rail__label">${label}</span>
		</a>`;
	}

	user_info() {
		const user = frappe.session.user;
		const info = (frappe.user_info && frappe.user_info(user)) || {};
		const name = info.fullname || (frappe.boot.user && frappe.boot.user.first_name) || user;
		const company =
			(frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) ||
			(frappe.boot.user && frappe.boot.user.email) ||
			"";
		return { name, company, image: info.image, abbr: info.abbr || initials(name) };
	}

	render() {
		const groups = GROUPS.map(([id, label]) => {
			const items = this.items.filter((i) => i.group === id);
			if (!items.length) return "";
			return `<div class="et-rail__group">
				<div class="et-rail__group-label">${esc(__(label))}</div>
				${items.map((i) => this.item_html(i)).join("")}
			</div>`;
		}).join("");

		const u = this.user_info();
		this.$rail = $(`
			<nav class="et-rail" aria-label="${esc(__("Main navigation"))}">
				<div class="et-rail__brand-row">
					<a class="et-rail__brand" href="/app" aria-label="${esc(BRAND.NAME)}">
						${LOGO}
						<span class="et-rail__brand-name">${esc(BRAND.NAME)}</span>
					</a>
					<button type="button" class="et-rail__collapse" aria-label="${esc(
						__("Collapse sidebar")
					)}">${icon("panel-left-close", 16, 1.6)}</button>
				</div>
				<div class="et-rail__scroll">${groups}</div>
				<div class="et-rail__footer">
					<div class="et-rail__menu" role="menu">
						<button type="button" data-action="settings">${icon("user", 15)} ${esc(
			__("My Settings")
		)}</button>
						<button type="button" data-action="theme">${icon("moon", 15)} ${esc(
			__("Toggle theme")
		)}</button>
						<hr>
						<button type="button" data-action="logout">${icon("log-out", 15)} ${esc(
			__("Log out")
		)}</button>
					</div>
					<button type="button" class="et-rail__user" aria-haspopup="menu" aria-expanded="false">
						<span class="et-rail__avatar">${
							u.image ? `<img src="${esc(u.image)}" alt="">` : esc(u.abbr)
						}</span>
						<span class="et-rail__user-text">
							<span class="et-rail__user-name">${esc(u.name)}</span>
							<span class="et-rail__user-sub">${esc(u.company)}</span>
						</span>
						${icon("chevrons-up-down", 14, 1.6)}
					</button>
				</div>
			</nav>`);

		this.$backdrop = $(`<div class="et-rail-backdrop" aria-hidden="true"></div>`);
		$("body").append(this.$rail, this.$backdrop).addClass("et-has-rail");

		const $nav_container = $(".navbar > .container").first();
		if ($nav_container.length && !$nav_container.find(".et-rail-mobile-btn").length) {
			this.$mobile_btn = $(
				`<button type="button" class="et-rail-mobile-btn" aria-label="${esc(
					__("Open navigation")
				)}">${icon("menu", 18, 1.8)}</button>`
			).prependTo($nav_container);
		}
	}

	bind() {
		this.$rail.on("click", ".et-rail__item[data-route]", (e) => {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			frappe.set_route($(e.currentTarget).attr("data-route"));
			this.close_drawer();
		});

		this.$rail.on("click", ".et-rail__collapse", () =>
			this.set_collapsed(!$("body").hasClass("et-rail-collapsed"))
		);

		const $menu = this.$rail.find(".et-rail__menu");
		const $user = this.$rail.find(".et-rail__user");
		$user.on("click", (e) => {
			e.stopPropagation();
			const open = !$menu.hasClass("is-open");
			$menu.toggleClass("is-open", open);
			$user.attr("aria-expanded", open ? "true" : "false");
		});
		$(document).on("click.et-rail", () => {
			$menu.removeClass("is-open");
			$user.attr("aria-expanded", "false");
		});
		$menu.on("click", "[data-action]", (e) => {
			const action = $(e.currentTarget).attr("data-action");
			if (action === "settings") frappe.set_route("Form", "User", frappe.session.user);
			if (action === "theme") emadi_theme.toggle_theme && emadi_theme.toggle_theme();
			if (action === "logout") frappe.app.logout();
			this.close_drawer();
		});

		this.$backdrop.on("click", () => this.close_drawer());
		this.$mobile_btn && this.$mobile_btn.on("click", () => this.open_drawer());
		$(document).on("keydown.et-rail", (e) => {
			if (e.key === "Escape") {
				this.close_drawer();
				$menu.removeClass("is-open");
			}
		});
	}

	set_collapsed(collapsed, initial) {
		$("body").toggleClass("et-rail-collapsed", collapsed);
		this.$rail
			.find(".et-rail__collapse")
			.attr("aria-label", collapsed ? __("Expand sidebar") : __("Collapse sidebar"));
		storage_set(localStorage, COLLAPSED_KEY, collapsed ? "1" : "0");
		if (!initial) setTimeout(() => window.dispatchEvent(new Event("resize")), 260);
	}

	open_drawer() {
		$("body").addClass("et-rail-open");
	}

	close_drawer() {
		$("body").removeClass("et-rail-open");
	}

	find_by_key(key) {
		return this.items.find((w) => w.key === key);
	}

	find_by_module(module) {
		if (!module) return null;
		return (
			this.items.find((w) => w.module === module) ||
			this.items.find((w) => w.title === module) ||
			null
		);
	}

	resolve_active_key() {
		const route = frappe.get_route() || [];
		if (route[0] === "Workspaces") {
			const name = route[1] === "private" ? route[2] : route[1];
			if (name) return slug(name);
			return this.items[0] && this.items[0].key;
		}
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
		const first = this.items[0];
		return key === "home" || (first && key === first.key);
	}
}
