import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Role } from "@prisma/client";

interface RoleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: Role | null;
}

const RoleModal: FC<RoleModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [admin, setAdmin] = useState(false);

  const addMutation = trpc.role.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.role.update.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
  });

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description);
      setAdmin(editingItem.admin);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setAdmin(false);
  };

  const handleSave = () => {
    const data = {
      name,
      description,
      admin,
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
          <DialogTitle>{editingItem ? "Edit Role" : "Add New Role"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="admin" checked={admin} onCheckedChange={(checked) => setAdmin(!!checked)} />
            <Label htmlFor="admin">Administrator (Full Access)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleModal;
