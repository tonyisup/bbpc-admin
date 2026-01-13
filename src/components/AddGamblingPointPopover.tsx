import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { trpc } from "../utils/trpc";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AddGamblingPointPopoverProps {
	userId: string;
	seasonId: string;
	onSuccess?: () => void;
}

export function AddGamblingPointPopover({ userId, seasonId, onSuccess }: AddGamblingPointPopoverProps) {
	const [open, setOpen] = useState(false);
	const [points, setPoints] = useState<string>("0");
	const [gamblingTypeId, setGamblingTypeId] = useState<string>("");

	const { data: gamblingTypes } = trpc.gambling.getAllTypes.useQuery();

	const { mutate: addGamble, isLoading } = trpc.gambling.add.useMutation({
		onSuccess: () => {
			setOpen(false);
			setPoints("0");
			setGamblingTypeId("");
			toast.success("Gambling entry added successfully");
			onSuccess?.();
		},
		onError: (err) => {
			toast.error("Failed to add gambling entry: " + err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const pointsValue = parseInt(points);
		if (isNaN(pointsValue) || !gamblingTypeId) return;

		addGamble({
			userId,
			seasonId,
			points: pointsValue,
			gamblingTypeId,
		});
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
						<h4 className="font-medium leading-none">Add Gambling Entry</h4>
						<p className="text-sm text-muted-foreground">
							Manually add a gambling entry for this user.
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="type">Type</Label>
							<div className="col-span-2">
								<Select value={gamblingTypeId} onValueChange={setGamblingTypeId}>
									<SelectTrigger className="h-8">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{gamblingTypes?.map((type) => (
											<SelectItem key={type.id} value={type.id.toString()}>
												{type.title} (x{type.multiplier})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="points">Points</Label>
							<Input
								id="points"
								type="number"
								className="col-span-2 h-8"
								value={points}
								onChange={(e) => setPoints(e.target.value)}
								placeholder="0"
								required
							/>
						</div>
					</div>
					<Button type="submit" disabled={isLoading || !gamblingTypeId}>
						{isLoading ? "Adding..." : "Add Entry"}
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}
