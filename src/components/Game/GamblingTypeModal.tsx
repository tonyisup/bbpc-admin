import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { GamblingType } from "@prisma/client";

interface GamblingTypeModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	refreshItems: DispatchWithoutAction;
	editingItem?: GamblingType | null;
}

const GamblingTypeModal: FC<GamblingTypeModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [lookupId, setLookupId] = useState("");
	const [multiplier, setMultiplier] = useState(1.5);
	const [isActive, setIsActive] = useState(true);

	const [titleError, setTitleError] = useState("");
	const [lookupIdError, setLookupIdError] = useState("");

	const addMutation = trpc.gambling.createType.useMutation({
		onSuccess: () => {
			refreshItems();
			setOpen(false);
			resetForm();
		},
		onError: (err) => {
			alert("Failed to add gambling type: " + err.message);
		}
	});

	const updateMutation = trpc.gambling.updateType.useMutation({
		onSuccess: () => {
			refreshItems();
			setOpen(false);
			resetForm();
		},
		onError: (err) => {
			alert("Failed to update gambling type: " + err.message);
		}
	});

	useEffect(() => {
		if (editingItem) {
			setTitle(editingItem.title);
			setDescription(editingItem.description || "");
			setLookupId(editingItem.lookupId);
			setMultiplier(editingItem.multiplier);
			setIsActive(editingItem.isActive);
		} else {
			resetForm();
		}
	}, [editingItem]);

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setLookupId("");
		setMultiplier(1.5);
		setIsActive(true);
		setTitleError("");
		setLookupIdError("");
	};

	const handleSave = () => {
		const trimmedTitle = title.trim();
		const trimmedLookupId = lookupId.trim();

		let isValid = true;
		if (!trimmedTitle) {
			setTitleError("Title is required");
			isValid = false;
		} else {
			setTitleError("");
		}

		if (!trimmedLookupId) {
			setLookupIdError("Lookup ID is required");
			isValid = false;
		} else {
			setLookupIdError("");
		}

		if (!isValid) return;

		const data = {
			title: trimmedTitle,
			description: description.trim() || undefined,
			lookupId: trimmedLookupId,
			multiplier,
			isActive,
		};

		if (editingItem) {
			updateMutation.mutate({ id: editingItem.id, ...data });
		} else {
			addMutation.mutate(data);
		}
	};

	const isLoading = addMutation.isLoading || updateMutation.isLoading;
	const isFormInvalid = !title?.trim() || !lookupId?.trim();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{editingItem ? "Edit Gambling Type" : "Add New Gambling Type"}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className={titleError ? "border-destructive" : ""}
						/>
						{titleError && <p className="text-xs text-destructive">{titleError}</p>}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="lookupId">Lookup ID (unique code)</Label>
						<Input
							id="lookupId"
							value={lookupId}
							onChange={(e) => setLookupId(e.target.value)}
							className={lookupIdError ? "border-destructive" : ""}
						/>
						{lookupIdError && <p className="text-xs text-destructive">{lookupIdError}</p>}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Description (Optional)</Label>
						<Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="multiplier">Multiplier</Label>
						<Input
							id="multiplier"
							type="number"
							step="0.1"
							value={multiplier}
							onChange={(e) => setMultiplier(parseFloat(e.target.value))}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="isActive"
							checked={isActive}
							onCheckedChange={(checked) => setIsActive(checked === true)}
						/>
						<Label htmlFor="isActive">Active</Label>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleSave} disabled={isLoading || isFormInvalid}>
						{isLoading ? "Saving..." : "Save Gambling Type"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default GamblingTypeModal;
