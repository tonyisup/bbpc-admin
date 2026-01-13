import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "./ui/dialog";
import { trpc } from "../utils/trpc";

interface EditGamblingPointModalProps {
	gamble: {
		id: string;
		points: number;
		gamblingType?: {
			title: string;
		};
	} | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function EditGamblingPointModal({ gamble, isOpen, onClose, onSuccess }: EditGamblingPointModalProps) {
	const [points, setPoints] = useState<number>(0);

	useEffect(() => {
		if (gamble) {
			setPoints(gamble.points);
		}
	}, [gamble]);

	const { mutate: updateGamble, isLoading } = trpc.gambling.update.useMutation({
		onSuccess: () => {
			toast.success("Gambling entry updated successfully");
			onSuccess?.();
			onClose();
		},
		onError: (err) => {
			toast.error("Failed to update gambling entry: " + err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!gamble) return;

		updateGamble({
			id: gamble.id,
			points: points,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Edit Gambling Entry</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-1">
							<Label className="text-muted-foreground">Type</Label>
							<div className="font-semibold">{gamble?.gamblingType?.title || "Unknown Type"}</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="edit-points" className="text-right">
								Points
							</Label>
							<Input
								id="edit-points"
								type="number"
								className="col-span-3"
								value={points}
								onChange={(e) => {
									const v = e.target.value;
									const n = v === "" ? 0 : parseInt(v, 10);
									setPoints(n);
								}}
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
