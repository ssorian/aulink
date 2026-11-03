import { cva, type VariantProps } from "class-variance-authority";
import { initials } from "../../lib/initials";
import { cn } from "../../lib/utils";
import { type Tone, toneSurface } from "./tone";

const avatarVariants = cva(
	"inline-grid shrink-0 place-items-center rounded-full font-bold leading-none",
	{
		variants: {
			size: {
				sm: "size-6 text-xs",
				md: "size-8 text-xs",
				lg: "size-12 text-sm",
			},
		},
		defaultVariants: { size: "md" },
	},
);

export function Avatar({
	name,
	size = "md",
	tone = "teal",
	className,
}: { name: string; tone?: Tone; className?: string } & VariantProps<
	typeof avatarVariants
>) {
	return (
		<span
			data-slot="avatar"
			data-size={size}
			data-tone={tone}
			title={name}
			className={cn(avatarVariants({ size }), toneSurface[tone], className)}
		>
			{initials(name)}
		</span>
	);
}

const rotation: Tone[] = ["sky", "peach", "lilac", "mustard"];

/** Overlapping avatars; names beyond `max` collapse into a +N counter. */
export function AvatarStack({
	names,
	max = 3,
	size = "sm",
	className,
}: { names: string[]; max?: number; className?: string } & VariantProps<
	typeof avatarVariants
>) {
	const shown = names.slice(0, max).map((name, position) => ({
		name,
		position,
		key: names.slice(0, position + 1).filter((n) => n === name).length,
	}));
	const extra = names.length - shown.length;
	return (
		<span
			data-slot="avatar-stack"
			role="img"
			aria-label={names.join(", ")}
			className={cn("inline-flex items-center", className)}
		>
			{shown.map(({ name, position, key }) => (
				<Avatar
					key={`${name}:${key}`}
					name={name}
					size={size}
					tone={rotation[position % rotation.length]}
					className={cn("ring-2 ring-card", position > 0 && "-ml-2")}
				/>
			))}
			{extra > 0 && (
				<span
					data-slot="avatar-overflow"
					className={cn(
						avatarVariants({ size }),
						toneSurface.neutral,
						"-ml-2 ring-2 ring-card",
					)}
				>
					+{extra}
				</span>
			)}
		</span>
	);
}
