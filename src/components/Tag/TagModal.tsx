import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tag } from "@prisma/client";

interface TagModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: Tag | null;
}

const TagModal: FC<TagModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [nameError, setNameError] = useState("");

  const addMutation = trpc.tag.addTag.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
      toast.success("Tag added successfully");
    },
    onError: (err) => {
      toast.error("Failed to add tag: " + err.message);
    }
  });

  const updateMutation = trpc.tag.updateTag.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
      toast.success("Tag updated successfully");
    },
    onError: (err) => {
      toast.error("Failed to update tag: " + err.message);
    }
  });

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description || "");
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setNameError("");
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tag name is required");
      return;
    }
    setNameError("");

    const data = {
      name: trimmedName,
      description: description.trim() || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  const isLoading = addMutation.isLoading || updateMutation.isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Tag" : "Add New Tag"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tag Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagModal;
