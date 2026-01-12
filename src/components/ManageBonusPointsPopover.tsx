import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManageBonusPointsPopoverProps {
	userId: string;
	assignmentId: string;
	onUpdate?: () => void;
	bonusPoints: number;
	seasonId: string | null;
}

export function ManageBonusPointsPopover({
	userId,
	assignmentId,
	onUpdate,
	bonusPoints,
	seasonId
}: ManageBonusPointsPopoverProps) {
	const [open, setOpen] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [reason, setReason] = useState("");
	const [adjustment, setAdjustment] = useState(0);

	const { data: points, refetch: refetchPoints } = trpc.game.getUserAssignmentPoints.useQuery(
		{ userId, assignmentId },
		{ enabled: open }
	);

	const { data: gambles, refetch: refetchGambles } = trpc.gambling.getUserAssignmentGamblePoints.useQuery(
		{ userId, assignmentId },
		{ enabled: open }
	);

	const utils = trpc.useUtils();

	const { mutate: removePoint } = trpc.user.removePoint.useMutation({
		onSuccess: () => {
			toast.success("Point removed");
			refetchPoints();
			refetchGambles();
			onUpdate?.();
		},
		onError: (err) => {
			toast.error("Failed to remove point: " + err.message);
		}
	});

	const { mutate: addBonusPointEvent, isLoading: isAddingLoading } = trpc.game.addAssignmentPointEvent.useMutation({
		onSuccess: () => {
			toast.success("Bonus point added");
			setReason("");
			setAdjustment(0);
			setIsAdding(false);
			refetchPoints();
			onUpdate?.();
		},
		onError: (err) => {
			toast.error("Failed to add bonus point: " + err.message);
		}
	});

	const { mutate: confirmGamble } = trpc.gambling.confirmGamble.useMutation({
		onSuccess: () => {
			toast.success("Gamble confirmed");
			refetchPoints();
			refetchGambles();
			onUpdate?.();
		},
		onError: (err) => {
			toast.error("Failed to confirm gamble: " + err.message);
		}
	});

	const { mutate: rejectGamble } = trpc.gambling.rejectGamble.useMutation({
		onSuccess: () => {
			toast.success("Gamble rejected");
			refetchGambles();
		},
		onError: (err) => {
			toast.error("Failed to reject gamble: " + err.message);
		}
	});

	const handleAdd = () => {
		addBonusPointEvent({
			userId,
			assignmentId,
			gamePointLookupId: 'bonus',
			reason,
			adjustment,
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="h-auto p-1 font-normal hover:bg-gray-800">
					<span className="text-sm text-gray-400">{bonusPoints} pts</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 bg-gray-900 border-gray-700 text-gray-100">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Manage Bonus Points</h4>
						<Button
							size="icon"
							variant="outline"
							className="h-8 w-8"
							onClick={() => setIsAdding(!isAdding)}
						>
							<Plus className={`h-4 w-4 transition-transform ${isAdding ? "rotate-45" : ""}`} />
						</Button>
					</div>

					{isAdding && (
						<div className="space-y-3 p-3 bg-gray-800 rounded-md border border-gray-700">
							<div className="space-y-1">
								<Label htmlFor="reason" className="text-xs">Reason</Label>
								<Input
									id="reason"
									placeholder="Reason for bonus"
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									className="h-8 bg-gray-900 border-gray-700"
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="adjustment" className="text-xs">Points</Label>
								<Input
									id="adjustment"
									type="number"
									value={adjustment}
									onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
									className="h-8 bg-gray-900 border-gray-700"
								/>
							</div>
							<Button
								size="sm"
								className="w-full"
								onClick={handleAdd}
								disabled={isAddingLoading || !reason}
							>
								{isAddingLoading ? "Adding..." : "Add Bonus"}
							</Button>
						</div>
					)}

					<div className="space-y-2 max-h-80 overflow-y-auto">
						{gambles && gambles.length > 0 && (
							<div className="space-y-2 border-b border-gray-800 pb-2">
								<p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gambles</p>
								{(gambles as any[])?.map(g => (
									<div key={g.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded border border-gray-700/30">
										<div className="flex flex-col">
											<span className="text-xs font-medium">{g.gamblingType?.title} {g.targetUser ? `on ${g.targetUser.name}` : ""}</span>
											<span className="text-[10px] text-gray-400">{g.points} pts bet</span>
										</div>
										{!g.pointsId && (g.status === "pending" || g.status === "locked") && (
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="outline"
													className="h-7 px-2 text-[10px] bg-emerald-900/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
													onClick={() => confirmGamble({ gambleId: g.id, seasonId: seasonId || undefined })}
												>
													Confirm
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="h-7 px-2 text-[10px] bg-rose-900/20 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white"
													onClick={() => rejectGamble({ gambleId: g.id })}
												>
													Reject
												</Button>
											</div>
										)}
										{g.pointsId && (
											<span className="text-[10px] text-emerald-400 font-bold">WON</span>
										)}
										{!g.pointsId && g.status === "lost" && (
											<span className="text-[10px] text-rose-400 font-bold">LOST</span>
										)}
									</div>
								))}
							</div>
						)}

						<p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">Adjustments</p>
						{points?.map((ap) => (
							<div
								key={ap.id}
								className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700/50"
							>
								<div className="flex flex-col">
									<span className="text-sm font-medium">
										{ap.point.gamePointType?.title || ap.point.reason || "Adjustment"}
									</span>
									<span className="text-xs text-gray-400">
										{(ap.point.gamePointType?.points || 0) + (ap.point.adjustment || 0)} pts
									</span>
									{ap.point.gamePointType?.title && ap.point.reason && (
										<span className="text-[10px] text-gray-500 italic">{ap.point.reason}</span>
									)}
								</div>
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
									onClick={() => removePoint({ id: ap.pointsId })}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
						{points?.length === 0 && !isAdding && (
							<p className="text-center text-sm text-gray-500 py-4">No bonus points yet.</p>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
