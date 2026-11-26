// Small inline icon set for theme chrome (independent of Frappe's sprite so
// it can never break if sprite names change between versions).
const wrap = (d, size = 20) =>
	`<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icons = {
	chevrons: (s) => wrap('<path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/>', s),
	moon: (s) => wrap('<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z"/>', s),
	menu: (s) => wrap('<path d="M4 7h16M4 12h16M4 17h16"/>', s),
	search: (s) => wrap('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', s),
	check: (s) => wrap('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>', s),
	bell: (s) => wrap('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z"/><path d="M10 20a2 2 0 0 0 4 0"/>', s),
	calendar: (s) =>
		wrap('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', s),
	plus: (s) => wrap('<path d="M12 5v14M5 12h14"/>', s),
	clock: (s) => wrap('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', s),
	home: (s) => wrap('<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/>', s),
	folder: (s) => wrap('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>', s),
};
