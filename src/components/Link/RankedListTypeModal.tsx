import { FC, useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Settings2, ListTodo, Info } from "lucide-react";

interface RankedListTypeModalProps {
	typeId?: string;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export const RankedListTypeModal: FC<RankedListTypeModalProps> = ({
	typeId,
	onOpenChange,
	onSuccess,
}) => {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [maxItems, setMaxItems] = useState(10);
	const [targetType, setTargetType] = useState<"MOVIE" | "SHOW" | "EPISODE">("MOVIE");

	const { data: existingType, isLoading: isLoadingType } = trpc.rankedList.getAllTypes.useQuery(
		undefined,
		{
			enabled: !!typeId,
			select: (types) => types.find((t) => t.id === typeId),
		}
	);

	useEffect(() => {
		if (existingType) {
			setName(existingType.name);
			setDescription(existingType.description || "");
			setMaxItems(existingType.maxItems);
			setTargetType(existingType.targetType as any);
		}
	}, [existingType]);

	const createType = trpc.rankedList.createType.useMutation({
		onSuccess: () => {
			toast.success("List type created");
			onSuccess();
			onOpenChange(false);
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const updateType = trpc.rankedList.updateType.useMutation({
		onSuccess: () => {
			toast.success("List type updated");
			onSuccess();
			onOpenChange(false);
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (typeId) {
			updateType.mutate({
				id: typeId,
				name,
				description,
				maxItems,
				targetType,
			});
		} else {
			createType.mutate({
				name,
				description,
				maxItems,
				targetType,
			});
		}
	};

	const isMutating = createType.isLoading || updateType.isLoading;

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<div className="flex items-center gap-2 text-primary mb-1">
							<div className="p-2 rounded-full bg-primary/10">
								<Settings2 className="h-5 w-5" />
							</div>
							<DialogTitle className="text-xl">
								{typeId ? "Edit List Type" : "New List Type"}
							</DialogTitle>
						</div>
						<DialogDescription>
							Define the constraints and target for this ranked list type.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Top 10 Banger Movies"
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description (Optional)</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What is this list for?"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="maxItems">Max Items</Label>
								<Input
									id="maxItems"
									type="number"
									min={1}
									max={100}
									value={maxItems}
									onChange={(e) => setMaxItems(parseInt(e.target.value))}
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="targetType">Target Type</Label>
								<Select
									value={targetType}
									onValueChange={(v: any) => setTargetType(v)}
								>
									<SelectTrigger id="targetType">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MOVIE">Movie</SelectItem>
										<SelectItem value="SHOW">Show</SelectItem>
										<SelectItem value="EPISODE">Episode</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isMutating}>
							{isMutating ? "Saving..." : "Save List Type"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
