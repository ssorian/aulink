import type { ReactNode } from "react";
import { Icon } from "../../../components/ui/icon";
import "./directory.css";

export function DirectoryHeader({
	title,
	count,
	children,
}: {
	title: string;
	count: string;
	children: ReactNode;
}) {
	return (
		<header className="directory-header">
			<div>
				<h2>{title}</h2>
				<output aria-live="polite">{count}</output>
			</div>
			<div className="actions">{children}</div>
		</header>
	);
}

export function DirectorySearch({
	id,
	label,
	placeholder,
	value,
	onChange,
}: {
	id: string;
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="directory-search">
			<label htmlFor={id}>{label}</label>
			<div className="directory-search-field">
				<Icon name="search" size={18} />
				<input
					id={id}
					type="search"
					placeholder={placeholder}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				{value && (
					<button
						type="button"
						aria-label="Limpiar búsqueda"
						onClick={() => {
							onChange("");
							document.getElementById(id)?.focus();
						}}
					>
						<Icon name="close" size={16} />
					</button>
				)}
			</div>
		</div>
	);
}

export function DirectoryIdentity({
	name,
	secondary,
}: {
	name: ReactNode;
	secondary?: string;
}) {
	return (
		<span className="directory-identity">
			{name}
			{secondary && <span className="directory-matricula">{secondary}</span>}
		</span>
	);
}

export function DirectoryFilterChip({
	children,
	label,
	onRemove,
}: {
	children: ReactNode;
	label: string;
	onRemove: () => void;
}) {
	return (
		<button
			className="directory-filter-chip"
			type="button"
			aria-label={label}
			onClick={onRemove}
		>
			{children}
			<Icon name="close" size={14} />
		</button>
	);
}
