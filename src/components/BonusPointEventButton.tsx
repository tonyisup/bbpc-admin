import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Save, Undo, Upload, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { GamePointType, Point } from "@prisma/client";
import { trpc } from "@/utils/trpc";
import { FieldGroup } from "./ui/field";

export type PendingBonusPointEvent = {
	adjustment: number;
	gamePointLookupId: string;
	reason: string;
}
export interface BonusPointEventButtonProps {
	userId: string;
	seasonId?: string;
	assignmentId: string;
	event: PendingBonusPointEvent;
	onSaved?: (pointEvent: Point & { GamePointType: GamePointType | null }) => void;
}

export default function BonusPointEventButton({
	userId,
	seasonId,
	assignmentId,
	event,
	onSaved
}: BonusPointEventButtonProps) {
	const [pendingPointEvent, setPendingPointEvent] = useState<PendingBonusPointEvent>(event);
	const [pointEvent, setPointEvent] = useState<Point & { GamePointType: GamePointType | null } | null>(null);

	// Local state for immediate input feedback
	const [reason, setReason] = useState(event.reason);
	const [adjustment, setAdjustment] = useState(event.adjustment);

	const debouncedReason = useDebounce(reason, 500);
	const debouncedAdjustment = useDebounce(adjustment, 500);

	// Sync debounced values to pendingPointEvent
	useEffect(() => {
		setPendingPointEvent(prev => ({
			...prev,
			reason: debouncedReason,
			adjustment: debouncedAdjustment
		}));
	}, [debouncedReason, debouncedAdjustment]);

	const { mutateAsync: addBonusPointEvent } = trpc.game.addAssignmentPointEvent.useMutation(
		{
			onSuccess: (point) => {
				setPointEvent(point);
				onSaved?.(point);
			}
		}
	);

	const handleSave = async () => {
		addBonusPointEvent({
			userId,
			assignmentId,
			seasonId,
			gamePointLookupId: pendingPointEvent.gamePointLookupId,
			adjustment: pendingPointEvent.adjustment,
			reason: pendingPointEvent.reason,
		});
	};

	const handleReset = () => {
		setPendingPointEvent(event);
		setReason(event.reason);
		setAdjustment(event.adjustment);
	};

	const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReason(e.target.value);
	};

	const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAdjustment(parseInt(e.target.value) || 0);
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
								value={reason}
								onChange={handleReasonChange}
							/>
						</div>
						<div className="flex gap-2 items-center">
							<p className="border border-gray-700 p-2">{event.gamePointLookupId}</p>
							<Input
								type="number"
								placeholder="Adjustment"
								value={adjustment}
								onChange={handleAdjustmentChange}
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

