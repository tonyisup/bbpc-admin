import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { trpc } from "../utils/trpc";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AddPointPopoverProps {
	userId: string;
	seasonId: string;
	seasonName?: string;
	onSuccess?: () => void;
}

export function AddPointPopover({ userId, seasonId, seasonName, onSuccess }: AddPointPopoverProps) {
	const [open, setOpen] = useState(false);
	const [points, setPoints] = useState<string>("");
	const [reason, setReason] = useState("");
	const [gamePointTypeId, setGamePointTypeId] = useState<string>("custom");

	const { data: gamePointTypes } = trpc.game.getAllGamePointTypes.useQuery();

	const { mutate: addPoint, isLoading } = trpc.user.addPoint.useMutation({
		onSuccess: () => {
			setOpen(false);
			setPoints("0");
			setReason("");
			setGamePointTypeId("custom");
			toast.success("Points added successfully");
			onSuccess?.();
		},
		onError: (err) => {
			toast.error("Failed to add points: " + err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const pointsValue = parseFloat(points);
		if (isNaN(pointsValue) || !reason) return;

		addPoint({
			userId,
			seasonId,
			value: pointsValue,
			reason,
			gamePointTypeId: gamePointTypeId !== "custom" ? parseInt(gamePointTypeId) : undefined,
		});
	};

	const handleTypeChange = (value: string) => {
		setGamePointTypeId(value);
		if (value === "custom") {
			setPoints("0");
			setReason("");
		} else {
			const selectedType = gamePointTypes?.find((t) => t.id.toString() === value);
			if (selectedType) {
				setPoints("0");
				setReason(selectedType.title);
			}
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon" className="h-8 w-8">
					<Plus className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Add Points</h4>
						<p className="text-sm text-muted-foreground">
							Manually add points to this user for {seasonName || "this season"}.
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="type">Type</Label>
							<div className="col-span-2">
								<Select value={gamePointTypeId} onValueChange={handleTypeChange}>
									<SelectTrigger className="h-8">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="custom">Custom</SelectItem>
										{gamePointTypes?.map((type) => (
											<SelectItem key={type.id} value={type.id.toString()}>
												{type.title} ({type.points})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="points">Adjustment</Label>
							<Input
								id="points"
								type="number"
								step="0.5"
								className="col-span-2 h-8"
								value={points}
								onChange={(e) => setPoints(e.target.value)}
								placeholder="0"
								required
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="reason">Reason</Label>
							<Input
								id="reason"
								className="col-span-2 h-8"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Bonus, adjustment..."
								required
							/>
						</div>
					</div>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Adding..." : "Add Points"}
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}
