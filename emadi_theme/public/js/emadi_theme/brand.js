// Product branding shown in the sidebar and login screen.
// Change NAME to rename the product; the logo mark is in lucide.js (LOGO).
export const BRAND = {
	NAME: "Karkhana",
	TAGLINE: "From the order book to the shop floor, in one ledger.",
	SUBLINE: "Sales, stock, production, finance and people for manufacturers.",
};

// Quick-create actions (header "Create" menu + dashboard buttons).
// Only doctypes the user may create are shown (frappe.boot.user.can_create).
export const QUICK_CREATE = [
	{ doctype: "Sales Invoice", label: "New Sales Invoice", icon: "receipt-text" },
	{ doctype: "Purchase Order", label: "New Purchase Order", icon: "shopping-cart" },
	{ doctype: "Customer", label: "New Customer", icon: "users" },
	{ doctype: "Payment Entry", label: "New Payment", icon: "credit-card" },
	{ doctype: "Journal Entry", label: "New Journal Entry", icon: "book-open" },
	{ doctype: "Stock Entry", label: "New Stock Entry", icon: "boxes" },
];

export function allowed_quick_create() {
	const can = (frappe.boot.user && frappe.boot.user.can_create) || [];
	return QUICK_CREATE.filter((q) => can.includes(q.doctype));
}

export function initials(name) {
	return String(name || "?")
		.split(/[\s@._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}
