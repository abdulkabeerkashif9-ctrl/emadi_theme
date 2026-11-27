// Karkhana dashboard rendered above the Home workspace, fed by real ERPNext
// data through frappe.client.get_list (permission-checked, silent on error).
// Read-only: it never writes to the database. Results are cached per user
// for 10 minutes in sessionStorage to keep the Home page fast.

import { icon } from "./lucide";
import { allowed_quick_create } from "./brand";

const esc = (s) => frappe.utils.escape_html(String(s ?? ""));
const CACHE_MS = 10 * 60 * 1000;

function greeting() {
	const h = new Date().getHours();
	if (h < 12) return __("Good morning");
	if (h < 17) return __("Good afternoon");
	return __("Good evening");
}

function first_name() {
	const u = frappe.boot.user || {};
	return u.first_name || frappe.session.user_fullname || "";
}

function company() {
	return (frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) || "";
}

function currency() {
	return (frappe.boot.sysdefaults && frappe.boot.sysdefaults.currency) || "";
}

function fmt_date_long(d) {
	try {
		return moment(d).format("dddd, D MMMM YYYY");
	} catch (e) {
		return d.toDateString();
	}
}

function fmt_date_short(s) {
	try {
		return moment(s).format("D MMM");
	} catch (e) {
		return s;
	}
}

function compact(n) {
	if (n === null || n === undefined || isNaN(n)) return "—";
	const a = Math.abs(n);
	const sign = n < 0 ? "−" : "";
	if (a >= 1e9) return sign + (a / 1e9).toFixed(1) + "B";
	if (a >= 1e6) return sign + (a / 1e6).toFixed(1) + "M";
	if (a >= 1e3) return sign + (a / 1e3).toFixed(0) + "K";
	return sign + a.toFixed(0);
}

function full(n) {
	if (n === null || n === undefined || isNaN(n)) return "—";
	return Math.round(n).toLocaleString();
}

function iso(d) {
	return frappe.datetime.obj_to_str(d);
}

// get_list wrapper: resolves to rows or null, never shows a dialog
function q(doctype, fields, filters, extra = {}) {
	return new Promise((resolve) => {
		frappe.call({
			method: "frappe.client.get_list",
			args: Object.assign(
				{ doctype, fields, filters, limit_page_length: extra.limit ?? 0 },
				extra.order_by ? { order_by: extra.order_by } : {},
				extra.group_by ? { group_by: extra.group_by } : {}
			),
			silent: true,
			callback: (r) => resolve((r && r.message) || []),
			error: () => resolve(null),
		});
	});
}

async function sum(doctype, field, filters) {
	const rows = await q(doctype, [`sum(${field}) as total`], filters);
	if (rows === null) return null;
	return (rows[0] && flt(rows[0].total)) || 0;
}

function months_back(n) {
	// returns [{label, from, to}] oldest → newest, current month last (to date)
	const out = [];
	const now = new Date();
	for (let i = n - 1; i >= 0; i--) {
		const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const end = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
		out.push({ label: moment(start).format("MMM"), from: iso(start), to: iso(end) });
	}
	return out;
}

function spark_svg(values) {
	const v = (values || []).filter((x) => x !== null && !isNaN(x));
	if (v.length < 2) return "";
	const w = 80,
		h = 32,
		pad = 3;
	const min = Math.min(...v),
		max = Math.max(...v);
	const span = max - min || 1;
	const pts = v.map((y, i) => [
		(i / (v.length - 1)) * (w - pad * 2) + pad,
		h - pad - ((y - min) / span) * (h - pad * 2),
	]);
	const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
	const last = pts[pts.length - 1];
	return `<svg class="k-kpi__spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}"></path><circle cx="${last[0].toFixed(
		1
	)}" cy="${last[1].toFixed(1)}" r="2.2"></circle></svg>`;
}

export class Dashboard {
	constructor(rail) {
		this.rail = rail;
	}

	refresh() {
		const route = frappe.get_route() || [];
		const $page = $("#page-Workspaces");
		if (route[0] !== "Workspaces" || !$page.length) return false;

		const name = route[1] === "private" ? route[2] : route[1];
		const key = name ? frappe.router.slug(name) : "home";
		const is_home = !name || !this.rail || this.rail.is_home(key);

		const $wrapper = $page.find(".layout-main-section-wrapper").first();
		if (!$wrapper.length) return false;

		let $dash = $wrapper.children(".k-dash");
		$page.toggleClass("k-has-dash", is_home);
		if (!is_home) {
			$dash.remove();
			return true;
		}
		if (!$dash.length) {
			$dash = $(this.template()).prependTo($wrapper);
			this.bind($dash);
			this.load($dash);
		}
		return true;
	}

	template() {
		const co = company();
		const quick = allowed_quick_create()
			.map(
				(a) =>
					`<button type="button" class="k-quick__btn" data-doctype="${esc(a.doctype)}">${icon(
						a.icon,
						16
					)}${esc(__(a.label))}</button>`
			)
			.join("");
		const kpi = (id, label, dot, featured) => `
			<a class="k-kpi ${featured ? "is-featured" : ""}" data-kpi="${id}">
				<span class="k-kpi__label">${esc(__(label))}</span>
				<span class="k-kpi__dot ${dot}"></span>
				<span class="k-kpi__value"><span class="k-kpi__cur">${esc(currency())}</span><span class="v">—</span></span>
				<span class="k-kpi__delta"></span>
			</a>`;
		return `
		<section class="k-dash" aria-label="${esc(__("Dashboard"))}">
			<div class="k-dash__head">
				<div>
					<h1 class="k-dash__title">${esc(greeting())}${first_name() ? ", " + esc(first_name()) : ""}</h1>
					<p class="k-dash__sub">${esc(co)}${co ? " · " : ""}${esc(fmt_date_long(new Date()))}</p>
				</div>
				<div class="k-dash__tools">
					<button type="button" class="btn btn-default btn-sm" data-action="fy">${icon("calendar-range", 15)}<span class="k-fy-label">${esc(
			__("Fiscal year to date")
		)}</span>${icon("chevron-down", 14)}</button>
					<button type="button" class="btn btn-default btn-sm" data-action="customize">${icon(
						"sliders-horizontal",
						15
					)}${esc(__("Customize"))}</button>
				</div>
			</div>
			${quick ? `<div class="k-quick">${quick}</div>` : ""}
			<div class="k-kpis">
				${kpi("revenue", "Total Revenue", "", true)}
				${kpi("expenses", "Total Expenses", "is-ok")}
				${kpi("profit", "Net Profit", "")}
				${kpi("cash", "Cash & Bank", "is-ok")}
				${kpi("receivables", "Receivables", "")}
				${kpi("payables", "Payables", "")}
				${kpi("inventory", "Inventory Value", "is-ink")}
				<div class="k-kpi k-kpi--note"><strong>${esc(__("Comparison period"))}</strong><span class="k-period">—</span><span>${esc(
			__("Trend lines show the last eight closed months.")
		)}</span></div>
			</div>
			<div class="k-grid">
				<section class="k-card k-span-8">
					<header class="k-card__head"><div><h2 class="k-card__title">${esc(
						__("Revenue vs Expenses")
					)}</h2><p class="k-card__sub">${esc(
			__("Last 12 months, from submitted invoices. Current month is to date.")
		)}</p></div></header>
					<div class="k-card__body">
						<div class="k-legend"><span><i></i>${esc(__("Revenue"))}</span><span><i class="is-line"></i>${esc(
			__("Expenses")
		)}</span></div>
						<div class="k-chart" data-chart="revexp"></div>
					</div>
				</section>
				<section class="k-card k-span-4">
					<header class="k-card__head"><h2 class="k-card__title">${esc(
						__("Pending Approvals")
					)}</h2><a class="k-link" data-route="List/Purchase Order?docstatus=0">${esc(__("View all"))}${icon(
			"chevron-right",
			14
		)}</a></header>
					<div class="k-card__body"><ul class="k-approvals"><li class="k-empty">${esc(__("Loading…"))}</li></ul><div class="k-foot-note"></div></div>
				</section>
				<section class="k-card k-span-8">
					<header class="k-card__head"><h2 class="k-card__title">${esc(
						__("Recent Transactions")
					)}</h2><a class="k-link" data-route="List/Payment Entry">${esc(__("View all"))}${icon(
			"chevron-right",
			14
		)}</a></header>
					<div class="k-card__body"><table class="k-table"><thead><tr><th>${esc(__("Entry"))}</th><th>${esc(
			__("Party")
		)}</th><th>${esc(__("Date"))}</th><th>${esc(__("Mode"))}</th><th>${esc(__("Amount"))} (${esc(
			currency()
		)})</th></tr></thead><tbody><tr><td colspan="5" class="k-empty">${esc(
			__("Loading…")
		)}</td></tr></tbody></table></div>
				</section>
				<section class="k-card k-span-4">
					<header class="k-card__head"><div><h2 class="k-card__title">${esc(
						__("Top Customers")
					)}</h2><p class="k-card__sub">${esc(__("Fiscal year to date"))}</p></div></header>
					<div class="k-card__body"><ul class="k-bars"><li class="k-empty">${esc(__("Loading…"))}</li></ul></div>
				</section>
			</div>
		</section>`;
	}

	bind($dash) {
		$dash.on("click", "[data-doctype]", (e) => frappe.new_doc($(e.currentTarget).attr("data-doctype")));
		$dash.on("click", "[data-action='customize']", () => {
			const $edit = $("#page-Workspaces .btn-edit-workspace:visible");
			if ($edit.length) $edit.trigger("click");
		});
		$dash.on("click", "[data-action='fy']", () => frappe.set_route("List", "Fiscal Year"));
		$dash.on("click", "[data-route]", (e) => {
			const r = $(e.currentTarget).attr("data-route");
			const [path, qs] = r.split("?");
			if (qs) frappe.route_options = Object.fromEntries(new URLSearchParams(qs));
			frappe.set_route(...path.split("/"));
		});
		$dash.on("click", "[data-open]", (e) => {
			const [dt, dn] = $(e.currentTarget).attr("data-open").split("::");
			frappe.set_route("Form", dt, dn);
		});
		$dash.on("click", "[data-kpi]", (e) => {
			const map = {
				revenue: ["List", "Sales Invoice"],
				expenses: ["List", "Purchase Invoice"],
				profit: ["query-report", "Profit and Loss Statement"],
				cash: ["query-report", "General Ledger"],
				receivables: ["query-report", "Accounts Receivable"],
				payables: ["query-report", "Accounts Payable"],
				inventory: ["query-report", "Stock Balance"],
			};
			const r = map[$(e.currentTarget).attr("data-kpi")];
			r && frappe.set_route(...r);
		});
	}

	cache_key() {
		return `k_dash::${frappe.session.user}::${company()}`;
	}

	async load($dash) {
		let data = null;
		try {
			const c = JSON.parse(sessionStorage.getItem(this.cache_key()) || "null");
			if (c && Date.now() - c.at < CACHE_MS) data = c.data;
		} catch (e) {
			/* ignore */
		}
		if (!data) {
			data = await this.fetch();
			try {
				sessionStorage.setItem(this.cache_key(), JSON.stringify({ at: Date.now(), data }));
			} catch (e) {
				/* ignore */
			}
		}
		if (!document.body.contains($dash[0])) return;
		this.paint($dash, data);
	}

	async fetch() {
		const co = company();
		const cf = co ? [["company", "=", co]] : [];
		const today = frappe.datetime.get_today();

		// Fiscal year start (fallback: 1 Jan)
		let fy_start = today.slice(0, 4) + "-01-01";
		const fy = await q(
			"Fiscal Year",
			["year_start_date"],
			[
				["year_start_date", "<=", today],
				["year_end_date", ">=", today],
			],
			{ limit: 1 }
		);
		if (fy && fy[0]) fy_start = fy[0].year_start_date;

		const days = frappe.datetime.get_diff(today, fy_start);
		const prev_to = frappe.datetime.add_days(fy_start, -1);
		const prev_from = frappe.datetime.add_days(prev_to, -days);

		const inv = (dt, from, to) =>
			sum(dt, "base_net_total", [["docstatus", "=", 1], ["posting_date", "between", [from, to]], ...cf]);

		const months = months_back(12);
		const [rev, exp, rev_prev, exp_prev, rec, pay, inventory, cash, mrev, mexp, approvals, approvals_count, payments, customers] =
			await Promise.all([
				inv("Sales Invoice", fy_start, today),
				inv("Purchase Invoice", fy_start, today),
				inv("Sales Invoice", prev_from, prev_to),
				inv("Purchase Invoice", prev_from, prev_to),
				sum("Sales Invoice", "outstanding_amount", [["docstatus", "=", 1], ...cf]),
				sum("Purchase Invoice", "outstanding_amount", [["docstatus", "=", 1], ...cf]),
				sum("Bin", "stock_value", []),
				this.cash_balance(co),
				Promise.all(months.map((m) => inv("Sales Invoice", m.from, m.to))),
				Promise.all(months.map((m) => inv("Purchase Invoice", m.from, m.to))),
				q("Purchase Order", ["name", "supplier_name", "grand_total", "currency"], [["docstatus", "=", 0], ...cf], {
					order_by: "modified desc",
					limit: 5,
				}),
				q("Purchase Order", ["count(name) as n"], [["docstatus", "=", 0], ...cf]),
				q(
					"Payment Entry",
					["name", "party_name", "posting_date", "mode_of_payment", "paid_amount", "payment_type"],
					[["docstatus", "=", 1], ...cf],
					{ order_by: "posting_date desc, creation desc", limit: 7 }
				),
				q(
					"Sales Invoice",
					["customer_name", "sum(base_net_total) as total"],
					[["docstatus", "=", 1], ["posting_date", "between", [fy_start, today]], ...cf],
					{ group_by: "customer_name" }
				),
			]);

		return {
			fy_start,
			prev_from,
			prev_to,
			today,
			rev,
			exp,
			rev_prev,
			exp_prev,
			rec,
			pay,
			inventory,
			cash,
			months: months.map((m) => m.label),
			mrev,
			mexp,
			approvals,
			approvals_count: approvals_count && approvals_count[0] ? cint(approvals_count[0].n) : 0,
			payments,
			customers,
		};
	}

	async cash_balance(co) {
		const accounts = await q(
			"Account",
			["name"],
			[["account_type", "in", ["Bank", "Cash"]], ["is_group", "=", 0], ...(co ? [["company", "=", co]] : [])]
		);
		if (!accounts || !accounts.length) return accounts === null ? null : 0;
		const rows = await q(
			"GL Entry",
			["sum(debit) as d", "sum(credit) as c"],
			[["account", "in", accounts.map((a) => a.name)], ["is_cancelled", "=", 0]]
		);
		if (!rows) return null;
		return flt(rows[0] && rows[0].d) - flt(rows[0] && rows[0].c);
	}

	paint($dash, d) {
		const set_kpi = (id, value, spark, delta_html) => {
			const $k = $dash.find(`[data-kpi="${id}"]`);
			$k.find(".v").text(compact(value));
			$k.find(".k-kpi__spark").remove();
			if (spark) $k.append(spark);
			$k.find(".k-kpi__delta").html(delta_html || "");
		};
		const delta = (cur, prev) => {
			if (cur === null || prev === null || !prev) return "";
			const pct = ((cur - prev) / Math.abs(prev)) * 100;
			const up = pct >= 0;
			return `<b>${icon(up ? "arrow-up-right" : "arrow-down-right", 11, 2)}${Math.abs(pct).toFixed(
				1
			)}%</b>${esc(__("vs previous period"))}`;
		};
		const closed8 = (arr) => (arr || []).slice(3, 11); // eight closed months before current
		const profit_series = (d.mrev || []).map((r, i) => (r === null || d.mexp[i] === null ? null : r - d.mexp[i]));
		const profit = d.rev === null || d.exp === null ? null : d.rev - d.exp;
		const profit_prev = d.rev_prev === null || d.exp_prev === null ? null : d.rev_prev - d.exp_prev;
		const as_of = `<span>${esc(__("as of {0}", [fmt_date_short(d.today)]))}</span>`;

		set_kpi("revenue", d.rev, spark_svg(closed8(d.mrev)), delta(d.rev, d.rev_prev));
		set_kpi("expenses", d.exp, spark_svg(closed8(d.mexp)), delta(d.exp, d.exp_prev));
		set_kpi("profit", profit, spark_svg(closed8(profit_series)), delta(profit, profit_prev));
		set_kpi("cash", d.cash, "", as_of);
		set_kpi("receivables", d.rec, "", as_of);
		set_kpi("payables", d.pay, "", as_of);
		set_kpi("inventory", d.inventory, "", as_of);
		$dash
			.find(".k-period")
			.text(`${frappe.datetime.str_to_user(d.prev_from)} ${__("to")} ${frappe.datetime.str_to_user(d.prev_to)}`);

		this.paint_chart($dash, d);
		this.paint_approvals($dash, d);
		this.paint_payments($dash, d);
		this.paint_customers($dash, d);
	}

	paint_chart($dash, d) {
		const el = $dash.find("[data-chart='revexp']")[0];
		if (!el || !frappe.Chart) return;
		const dark = document.documentElement.getAttribute("data-theme") === "dark";
		try {
			new frappe.Chart(el, {
				type: "line",
				height: 260,
				data: {
					labels: d.months,
					datasets: [
						{ name: __("Revenue"), values: (d.mrev || []).map((v) => v || 0) },
						{ name: __("Expenses"), values: (d.mexp || []).map((v) => v || 0) },
					],
				},
				colors: dark ? ["#4f7a5c", "#bc9650"] : ["#3f5e48", "#bd9a55"],
				lineOptions: { regionFill: 1, hideDots: 1, spline: 1 },
				axisOptions: { xIsSeries: 1, shortenYAxisNumbers: 1 },
				legendOptions: { hide: true },
				tooltipOptions: { formatTooltipY: (v) => `${currency()} ${full(v)}` },
			});
			$(el).find(".chart-legend").hide();
		} catch (e) {
			console.warn("[emadi_theme] chart", e);
		}
	}

	paint_approvals($dash, d) {
		const $ul = $dash.find(".k-approvals");
		if (!d.approvals || !d.approvals.length) {
			$ul.html(`<li class="k-empty">${esc(__("Nothing waiting for approval."))}</li>`);
			return;
		}
		$ul.html(
			d.approvals
				.map(
					(r) => `<li>
					<div class="k-approvals__main">
						<span class="k-approvals__id">${esc(r.name)}</span><span class="k-approvals__amt">${esc(
						r.currency || currency()
					)} ${esc(compact(r.grand_total))}</span>
						<div class="k-approvals__party">${esc(r.supplier_name || "")}</div>
					</div>
					<button type="button" class="k-btn-xs" data-open="Purchase Order::${esc(r.name)}">${icon("check", 13, 2)}${esc(
						__("Review")
					)}</button>
				</li>`
				)
				.join("")
		);
		const more = d.approvals_count - d.approvals.length;
		$dash.find(".k-foot-note").text(more > 0 ? __("{0} more draft purchase orders", [more]) : "");
	}

	paint_payments($dash, d) {
		const $tb = $dash.find(".k-table tbody");
		if (!d.payments || !d.payments.length) {
			$tb.html(`<tr><td colspan="5" class="k-empty">${esc(__("No payments yet."))}</td></tr>`);
			return;
		}
		$tb.html(
			d.payments
				.map((p) => {
					const inbound = p.payment_type === "Receive";
					return `<tr data-open="Payment Entry::${esc(p.name)}">
						<td class="tnum">${esc(p.name)}</td>
						<td>${esc(p.party_name || "—")}</td>
						<td class="tnum">${esc(fmt_date_short(p.posting_date))}</td>
						<td>${esc(p.mode_of_payment || p.payment_type || "")}</td>
						<td class="tnum ${inbound ? "k-in" : "k-out"}">${inbound ? "+" : "−"}${esc(full(p.paid_amount))}</td>
					</tr>`;
				})
				.join("")
		);
	}

	paint_customers($dash, d) {
		const $ul = $dash.find(".k-bars");
		const rows = (d.customers || []).map((r) => ({ name: r.customer_name, total: flt(r.total) }));
		if (!rows.length) {
			$ul.html(`<li class="k-empty">${esc(__("No sales this fiscal year."))}</li>`);
			return;
		}
		rows.sort((a, b) => b.total - a.total);
		const grand = rows.reduce((s, r) => s + r.total, 0) || 1;
		const top = rows.slice(0, 5);
		const others = rows.slice(5).reduce((s, r) => s + r.total, 0);
		if (others > 0) top.push({ name: __("All others"), total: others, muted: true });
		const max = Math.max(...top.map((r) => r.total)) || 1;
		$ul.html(
			top
				.map(
					(r) => `<li>
					<div class="k-bars__row"><span>${esc(r.name)}</span><span>${esc(compact(r.total))}<small>${Math.round(
						(r.total / grand) * 100
					)}%</small></span></div>
					<div class="k-bars__track"><div class="k-bars__fill" style="width:${((r.total / max) * 100).toFixed(1)}%;${
						r.muted ? "opacity:.45" : ""
					}"></div></div>
				</li>`
				)
				.join("")
		);
	}
}
