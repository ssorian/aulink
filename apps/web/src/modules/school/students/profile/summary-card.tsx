import { type ReactNode, useId } from "react";
import { Button } from "../../../../components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../../../components/ui/card";
import { Icon } from "../../../../components/ui/icon";

/** Keeps a stat's number whole and lets its caption drop below instead of squeezing it. */
export const statWrap = "[&_dd]:flex-wrap [&_strong]:whitespace-nowrap";

/** One block of the Resumen: title, optional meta and action in the header, body, optional footer. */
export function SummaryCard({
	heading,
	meta,
	action,
	footer,
	children,
}: {
	heading: string;
	meta?: ReactNode;
	action?: ReactNode;
	footer?: ReactNode;
	children: ReactNode;
}) {
	const headingId = useId();
	return (
		<Card aria-labelledby={headingId}>
			<CardHeader>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<CardTitle id={headingId}>{heading}</CardTitle>
					{meta}
				</div>
				{action}
			</CardHeader>
			<CardContent>{children}</CardContent>
			{footer && <CardFooter>{footer}</CardFooter>}
		</Card>
	);
}

export function CardLink({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<Button variant="link" className="min-h-11" onClick={onClick}>
			{label}
			<Icon name="arrow" size={14} />
		</Button>
	);
}
