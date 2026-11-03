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
		<nav
			data-slot="workspace-tabs"
			className="workspace-tabs mt-5 mb-6 flex max-w-full gap-[18px] overflow-x-auto border-b border-border px-[3px] [scrollbar-color:var(--color-input)_transparent] [scrollbar-width:thin] md:gap-5"
			aria-label={label}
		>
			{items.map((item) => (
				<button
					key={item}
					type="button"
					className="min-h-11 shrink-0 whitespace-nowrap rounded-none border-0 border-b-2 border-transparent bg-transparent px-0.5 py-3 text-xs text-muted-foreground hover:border-border hover:bg-transparent hover:text-primary focus-visible:-outline-offset-3 aria-[current]:border-primary aria-[current]:text-primary-hover md:text-[13px]"
					aria-current={value === item ? "page" : undefined}
					onClick={() => onChange(item)}
				>
					{item}
				</button>
			))}
		</nav>
	);
}
