/** Up to two uppercase leading letters of a name; words starting with symbols are skipped. */
export function initials(name: string) {
	return name
		.split(/\s+/)
		.filter((word) => /^[\p{L}\d]/u.test(word))
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
}
