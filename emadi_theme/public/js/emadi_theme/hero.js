// Command-center header on the Home workspace: greeting, quick actions,
// lightweight KPIs and recently opened documents. It is inserted *beside*
// the workspace body (never inside it), so Workspace editing and rendering
// are untouched.

import { icons } from "./icons";
import { get_recent_docs } from "./recent";

const esc = (s) => frappe.utils.escape_html(String(s ?? ""));

function greeting() {
	const h = new Date().getHours();
	if (h < 12) return __("Good morning");
	if (h < 17) return __("Good afternoon");
	return __("Good evening");
}

function first_name() {
	const u = frappe.boot.user || {};
	return u.first_name || (frappe.user && frappe.user.full_name && frappe.user.full_name()) || "";
}

function today_label() {
	try {
		return window.moment ? moment().format("dddd, D MMMM YYYY") : new Date().toDateString();
	} catch (e) {
		return "";
	}
}

function initials(doctype) {
	return String(doctype)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}

function time_ago(ts) {
	try {
		return frappe.datetime.comment_when(frappe.datetime.obj_to_str(new Date(ts)), true);
	} catch (e) {
		return "";
	}
}

// Silent count: never pops a dialog if a user lacks permission
function count(doctype, filters) {
	return new Promise((resolve) => {
		frappe.call({
			method: "frappe.client.get_count",
			args: { doctype, filters },
			type: "GET",
			silent: true,
			callback: (r) => resolve(r && r.message !== undefined ? r.message : null),
			error: () => resolve(null),
		});
	});
}

export class Hero {
	constructor(rail) {
		this.rail = rail;
	}

	refresh() {
		const route = frappe.get_route() || [];
		const $page = $("#page-Workspaces");
		if (route[0] !== "Workspaces" || !$page.length) return false;

		const name = route[1] === "private" ? route[2] : route[1];
		const key = name ? frappe.router.slug(name) : "home";
		const is_home = !this.rail || this.rail.is_home(key) || !name;

		const $wrapper = $page.find(".layout-main-section-wrapper").first();
		if (!$wrapper.length) return false;

		let $hero = $wrapper.children(".et-hero");
		if (!is_home) {
			$hero.remove();
			return true;
		}

		if (!$hero.length) {
			$hero = $(this.template()).prependTo($wrapper);
			this.bind($hero);
			this.load_stats($hero);
		}
		this.render_recent($hero);
		return true;
	}

	template() {
		const mod = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		return `
		<section class="et-hero" aria-label="${esc(__("Overview"))}">
			<div class="et-hero__banner">
				<div class="et-hero__text">
					<div class="et-hero__eyebrow"><span class="et-dot"></span>${esc(today_label())}</div>
					<h1 class="et-hero__title">${esc(greeting())}${
			first_name() ? ", " + esc(first_name()) : ""
		}</h1>
					<p class="et-hero__subtitle">${esc(
						__("Here is what needs your attention across the business today.")
					)}</p>
				</div>
				<div class="et-hero__actions">
					<button type="button" class="et-hero__btn et-hero__btn--solid" data-action="search">
						${icons.search(16)} ${esc(__("Search"))} <kbd>${mod} G</kbd>
					</button>
					<button type="button" class="et-hero__btn" data-action="todo">
						${icons.plus(16)} ${esc(__("New To-Do"))}
					</button>
					<button type="button" class="et-hero__btn" data-action="calendar">
						${icons.calendar(16)} ${esc(__("Calendar"))}
					</button>
				</div>
			</div>
			<div class="et-hero__grid">
				<a class="et-stat" href="/app/todo?status=Open&allocated_to=${encodeURIComponent(
					frappe.session.user
				)}" data-stat="todo">
					<div class="et-stat__head">${esc(__("Open To-Dos"))}
						<span class="et-stat__icon">${icons.check(16)}</span></div>
					<div class="et-stat__value">—</div>
					<div class="et-stat__meta">${esc(__("Assigned to you"))}</div>
				</a>
				<a class="et-stat" href="/app/notification-log?for_user=${encodeURIComponent(
					frappe.session.user
				)}" data-stat="notifications">
					<div class="et-stat__head">${esc(__("Notifications"))}
						<span class="et-stat__icon et-stat__icon--amber">${icons.bell(16)}</span></div>
					<div class="et-stat__value">—</div>
					<div class="et-stat__meta">${esc(__("Unread"))}</div>
				</a>
				<a class="et-stat" href="/app/event/view/calendar/default" data-stat="events">
					<div class="et-stat__head">${esc(__("Today's Events"))}
						<span class="et-stat__icon et-stat__icon--green">${icons.calendar(16)}</span></div>
					<div class="et-stat__value">—</div>
					<div class="et-stat__meta">${esc(__("On your calendar"))}</div>
				</a>
				<div class="et-panel">
					<div class="et-panel__head">
						<span class="et-panel__title">${esc(__("Recently viewed"))}</span>
						<span class="et-panel__hint">${icons.clock(14)}</span>
					</div>
					<ul class="et-recent"></ul>
				</div>
			</div>
		</section>`;
	}

	bind($hero) {
		$hero.on("click", "[data-action]", (e) => {
			const action = $(e.currentTarget).attr("data-action");
			if (action === "search") {
				$("#navbar-search").trigger("focus");
			} else if (action === "todo") {
				frappe.new_doc("ToDo");
			} else if (action === "calendar") {
				frappe.set_route("List", "Event", "Calendar");
			}
		});

		$hero.on("click", "a.et-stat, a.et-recent__item", (e) => {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			const href = $(e.currentTarget).attr("href");
			frappe.set_route(href.replace(/^\/app\//, ""));
		});
	}

	async load_stats($hero) {
		const user = frappe.session.user;
		const today = frappe.datetime.get_today();
		const set = (key, value) =>
			$hero
				.find(`[data-stat="${key}"] .et-stat__value`)
				.text(value === null ? "—" : format_number(value, null, 0));

		const [todo, notif, events] = await Promise.all([
			count("ToDo", { status: "Open", allocated_to: user }),
			count("Notification Log", { for_user: user, read: 0 }),
			count("Event", [["starts_on", "between", [today, today]]]),
		]);
		set("todo", todo);
		set("notifications", notif);
		set("events", events);
	}

	render_recent($hero) {
		const docs = get_recent_docs().slice(0, 4);
		const $list = $hero.find(".et-recent");
		if (!docs.length) {
			$list.html(
				`<li class="et-empty">${esc(
					__("Documents you open will appear here for quick access.")
				)}</li>`
			);
			return;
		}
		$list.html(
			docs
				.map((d) => {
					const href = `/app/${frappe.router.slug(d.doctype)}/${encodeURIComponent(d.name)}`;
					return `
					<li><a class="et-recent__item" href="${esc(href)}">
						<span class="et-recent__badge">${esc(initials(__(d.doctype)))}</span>
						<span class="et-recent__name">${esc(d.name)}</span>
						<span class="et-recent__type">${esc(__(d.doctype))} · ${esc(time_ago(d.ts))}</span>
					</a></li>`;
				})
				.join("")
		);
	}
}
