import { useState } from "react";
import { Save, Undo, Upload, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { GamePointType, Point } from "@prisma/client";
import { trpc } from "@/utils/trpc";
import { FieldGroup } from "./ui/field";

export type PendingPointEvent = {
	adjustment: number;
	gamePointLookupId: string;
	reason: string;
}
export interface PointEventButtonProps {
	userId: string;
	seasonId?: string;
	event: PendingPointEvent;
	onSaved?: (pointEvent: Point & { GamePointType: GamePointType | null }) => void;
}

export default function PointEventButton({
	userId,
	seasonId,
	event,
	onSaved
}: PointEventButtonProps) {
	const [pendingPointEvent, setPendingPointEvent] = useState<PendingPointEvent>(event);
	const [pointEvent, setPointEvent] = useState<Point & { GamePointType: GamePointType | null } | null>(null);
	const { mutateAsync: addPointEvent } = trpc.game.addPointEvent.useMutation(
		{
			onSuccess: (point) => {
				setPointEvent(point);
				onSaved?.(point);
			}
		}
	);

	const handleSave = async () => {
		addPointEvent({
			userId,
			seasonId,
			gamePointLookupId: pendingPointEvent.gamePointLookupId,
			adjustment: pendingPointEvent.adjustment,
			reason: pendingPointEvent.reason,
		});
	};

	const handleReset = () => {
		setPendingPointEvent(event);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon">
					<Upload />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="space-y-2">
				<FieldGroup>
					<div key={pendingPointEvent.gamePointLookupId}>
						<div className="">
							<Input
								type="text"
								placeholder="Reason"
								value={pendingPointEvent.reason}
								onChange={(e) => {
									pendingPointEvent.reason = e.target.value;
									setPendingPointEvent(pendingPointEvent);
								}}
							/>
						</div>
						<div className="flex gap-2 items-center">
							<p className="border border-gray-700 p-2">{event.gamePointLookupId}</p>
							<Input
								type="number"
								placeholder="Adjustment"
								value={event.adjustment}
								onChange={(e) => {
									event.adjustment = parseInt(e.target.value);
									setPendingPointEvent(event);
								}}
							/>
						</div>
					</div>
				</FieldGroup>
				<Button onClick={handleReset}>
					<Undo />
				</Button>
				<PopoverClose asChild>
					<Button size="icon" variant="ghost" onClick={handleSave}>
						<Save />
					</Button>
				</PopoverClose>
				<PopoverClose asChild>
					<Button size="icon" variant="ghost" onClick={handleReset}>
						<XIcon />
					</Button>
				</PopoverClose>
			</PopoverContent>
		</Popover>
	);
}

