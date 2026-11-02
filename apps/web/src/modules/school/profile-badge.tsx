/** One status vocabulary for the whole profile: ok, warn, off or current. */
export function ProfileBadge({
	tone,
	children,
}: {
	tone: "ok" | "warn" | "off" | "current" | "neutral";
	children: string;
}) {
	return (
		<span className={`profile-badge profile-badge--${tone}`}>{children}</span>
	);
}
