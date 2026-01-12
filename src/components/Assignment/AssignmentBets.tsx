import type { Assignment } from "@prisma/client";
import { type FC, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "../../utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Coins, User as UserIcon, PlusCircle, MinusCircle, Lock, Unlock, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

interface AssignmentBetsProps {
	assignment: Assignment;
	gamblingPoints: any[]; // Using any[] for flexibility with Prisma types
	onRefresh: () => void;
}

const AssignmentBets: FC<AssignmentBetsProps> = ({ assignment, gamblingPoints, onRefresh }) => {
	const { mutate: confirmGamble, isLoading: isConfirming } = trpc.gambling.confirmGamble.useMutation({
		onSuccess: () => {
			onRefresh();
			toast.success("Gamble confirmed");
		},
		onError: (err) => toast.error(err.message)
	});
	const { mutate: rejectGamble, isLoading: isRejecting } = trpc.gambling.rejectGamble.useMutation({
		onSuccess: () => {
			onRefresh();
			toast.success("Gamble rejected");
		},
		onError: (err) => toast.error(err.message)
	});
	const { mutate: updateStatus, isLoading: isUpdatingStatus } = trpc.gambling.updateStatus.useMutation({
		onSuccess: () => {
			onRefresh();
			toast.success("Status updated");
		},
		onError: (err) => toast.error(err.message)
	});

	const isProcessing = isConfirming || isRejecting || isUpdatingStatus;

	const getStatusBadge = (gp: any) => {
		if (gp.status === "won") return <Badge className="bg-emerald-600 text-white">Won</Badge>;
		if (gp.status === "lost") return <Badge variant="destructive">Lost</Badge>;
		if (gp.status === "locked") return <Badge variant="outline" className="text-blue-500 border-blue-500">Locked</Badge>;
		return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
	};

	const groupedByUser = useMemo(() => {
		const map = new Map<string, { user: any; bets: any[] }>();
		gamblingPoints?.forEach(gp => {
			const userId = gp.userId;
			if (!map.has(userId)) map.set(userId, { user: gp.user, bets: [] });
			map.get(userId)?.bets.push(gp);
		});
		return Array.from(map.values());
	}, [gamblingPoints]);

	return (
		<Card className="shadow-none border bg-card">
			<CardHeader className="flex flex-row items-center justify-between py-4">
				<div className="flex items-center gap-2">
					<Coins className="h-5 w-5 text-amber-500" />
					<CardTitle className="text-xl">Gambling Bets</CardTitle>
				</div>
				<Badge variant="secondary" className="font-bold">{gamblingPoints?.length || 0}</Badge>
			</CardHeader>
			<CardContent className="space-y-6">
				{groupedByUser.length === 0 ? (
					<p className="text-center py-6 text-sm text-muted-foreground italic">No bets for this assignment.</p>
				) : (
					groupedByUser.map(({ user, bets }) => (
						<div key={user.id} className="space-y-3">
							<div className="flex items-center gap-2 text-sm font-bold">
								<UserIcon className="h-4 w-4 text-primary" />
								{user.name || user.email}
							</div>
							<div className="grid gap-2 pl-6">
								{bets.map((gp) => (
									<div key={gp.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border group">
										<div className="flex items-center gap-4">
											{getStatusBadge(gp)}
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-sm font-medium">
													<Coins className="h-3 w-3 text-amber-500" />
													<span>{gp.points} pts</span>
													<span className="text-muted-foreground">×</span>
													<span className="text-primary">{gp.gamblingType?.multiplier ?? 1}x</span>
													<span className="text-xs text-muted-foreground">({gp.gamblingType?.title})</span>
												</div>
												{gp.TargetUser && (
													<div className="text-xs text-muted-foreground">
														Target: {gp.TargetUser.name}
													</div>
												)}
												{gp.status === "won" && gp.point && (
													<div className="text-xs text-emerald-500">
														Won: +{gp.point.adjustment} pts
													</div>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											{(gp.status === "pending" || gp.status === "locked") && (
												<>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
														onClick={() => confirmGamble({ gambleId: gp.id })}
														disabled={isProcessing}
														title="Confirm Win"
													>
														<PlusCircle className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={() => rejectGamble({ gambleId: gp.id })}
														disabled={isProcessing}
														title="Confirm Loss"
													>
														<MinusCircle className="h-4 w-4" />
													</Button>
													{gp.status === "pending" ? (
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
															onClick={() => updateStatus({ id: gp.id, status: "locked" })}
															disabled={isProcessing}
															title="Lock Bet"
														>
															<Lock className="h-4 w-4" />
														</Button>
													) : (
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
															onClick={() => updateStatus({ id: gp.id, status: "pending" })}
															disabled={isProcessing}
															title="Unlock Bet"
														>
															<Unlock className="h-4 w-4" />
														</Button>
													)}
												</>
											)}
											{(gp.status === "won" || gp.status === "lost") && (
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
													onClick={() => updateStatus({ id: gp.id, status: "pending" })}
													disabled={isProcessing}
													title="Reset to Pending"
												>
													<RotateCcw className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
};

export default AssignmentBets;
