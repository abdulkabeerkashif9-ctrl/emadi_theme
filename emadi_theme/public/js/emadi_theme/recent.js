// Tracks recently opened documents in localStorage (per user, per browser).
// Read-only with respect to Frappe: nothing is written to the server.

const MAX_ITEMS = 15;
const storage_key = () => `et_recent_docs::${frappe.session.user}`;

export function get_recent_docs() {
	try {
		const items = JSON.parse(localStorage.getItem(storage_key()) || "[]");
		return Array.isArray(items) ? items : [];
	} catch (e) {
		return [];
	}
}

export function track_current_route() {
	const route = frappe.get_route() || [];
	if (route[0] !== "Form" || !route[1] || !route[2]) return;

	const doctype = route[1];
	const name = String(route[2]);
	if (name.startsWith("new-")) return;

	// Skip single doctypes (settings pages) where name == doctype
	if (name === doctype) return;

	const items = get_recent_docs().filter((d) => !(d.doctype === doctype && d.name === name));
	items.unshift({ doctype, name, ts: Date.now() });

	try {
		localStorage.setItem(storage_key(), JSON.stringify(items.slice(0, MAX_ITEMS)));
	} catch (e) {
		// storage full / disabled: ignore, feature is optional
	}
}
