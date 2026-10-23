export function WorkspaceTabs<T extends string>({
	label,
	items,
	value,
	onChange,
}: {
	label: string;
	items: readonly T[];
	value: T;
	onChange: (value: T) => void;
}) {
	return (
		<nav className="workspace-tabs" aria-label={label}>
			{items.map((item) => (
				<button
					key={item}
					type="button"
					aria-current={value === item ? "page" : undefined}
					onClick={() => onChange(item)}
				>
					{item}
				</button>
			))}
		</nav>
	);
}
