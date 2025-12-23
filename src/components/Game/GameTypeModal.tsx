import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { GameType } from "@prisma/client";

interface GameTypeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: GameType | null;
}

const GameTypeModal: FC<GameTypeModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lookupID, setLookupID] = useState("");

  const [titleError, setTitleError] = useState("");
  const [lookupIDError, setLookupIDError] = useState("");

  const addMutation = trpc.game.addGameType.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to add game type: " + err.message);
    }
  });

  const updateMutation = trpc.game.updateGameType.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to update game type: " + err.message);
    }
  });

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || "");
      setLookupID(editingItem.lookupID);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLookupID("");
    setTitleError("");
    setLookupIDError("");
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedLookupID = lookupID.trim();

    let isValid = true;
    if (!trimmedTitle) {
      setTitleError("Title is required");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!trimmedLookupID) {
      setLookupIDError("Lookup ID is required");
      isValid = false;
    } else {
      setLookupIDError("");
    }

    if (!isValid) return;

    const data = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      lookupID: trimmedLookupID,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  const isLoading = addMutation.isLoading || updateMutation.isLoading;
  const isFormInvalid = !title?.trim() || !lookupID?.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Game Type" : "Add New Game Type"}</DialogTitle>
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
            <Label htmlFor="lookupID">Lookup ID (unique code)</Label>
            <Input
              id="lookupID"
              value={lookupID}
              onChange={(e) => setLookupID(e.target.value)}
              className={lookupIDError ? "border-destructive" : ""}
            />
            {lookupIDError && <p className="text-xs text-destructive">{lookupIDError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || isFormInvalid}>
            {isLoading ? "Saving..." : "Save Game Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameTypeModal;
