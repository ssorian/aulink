import { flushSync } from "react-dom";
import { Dialog } from "../../../../components/ui/dialog";
import type { ViewProps } from "../../shared/view-types";
import type { State } from "../../shared/workflows";
import { GuardianDetail } from "./guardian-detail";

type Link = State["links"][number];

/** Native close restores focus to the row that opened the dialog. */
export function GuardianDialog({
	link,
	open,
	onClose,
}: Pick<ViewProps, "open"> & { link?: Link; onClose: () => void }) {
	return (
		<Dialog open={!!link} onClose={onClose} title={link?.name ?? "Tutor"}>
			{link && (
				<GuardianDetail
					link={link}
					open={open}
					// Close first so the shared flow dialog opens on a clean top layer.
					onClose={() => flushSync(onClose)}
				/>
			)}
		</Dialog>
	);
}
