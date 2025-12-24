import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Rating } from "@prisma/client";

interface RatingModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: Rating | null;
}

const RatingModal: FC<RatingModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState(0);
  const [sound, setSound] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState("");
  const [nameError, setNameError] = useState("");

  const addMutation = trpc.rating.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to add rating: " + err.message);
    }
  });

  const updateMutation = trpc.rating.update.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to update rating: " + err.message);
    }
  });

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setValue(editingItem.value);
      setSound(editingItem.sound || "");
      setIcon(editingItem.icon || "");
      setCategory(editingItem.category || "");
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setName("");
    setValue(0);
    setSound("");
    setIcon("");
    setCategory("");
    setNameError("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    const data = {
      name: name.trim(),
      value,
      sound: sound.trim() || undefined,
      icon: icon.trim() || undefined,
      category: category.trim() || undefined,
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
          <DialogTitle>{editingItem ? "Edit Rating" : "Add New Rating"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Value (1-5 or similar)</Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setValue(0);
                } else {
                  const parsed = parseInt(val, 10);
                  setValue(Number.isNaN(parsed) ? 0 : parsed);
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="icon">Icon (URL or Name) (Optional)</Label>
            <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sound">Sound URL (Optional)</Label>
            <Input id="sound" value={sound} onChange={(e) => setSound(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
