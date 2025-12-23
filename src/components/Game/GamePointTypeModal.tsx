import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { GamePointType } from "@prisma/client";

interface GamePointTypeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: GamePointType | null;
  defaultGameTypeId?: number;
}

const GamePointTypeModal: FC<GamePointTypeModalProps> = ({ open, setOpen, refreshItems, editingItem, defaultGameTypeId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lookupID, setLookupID] = useState("");
  const [points, setPoints] = useState(0);
  const [gameTypeId, setGameTypeId] = useState<number>(0);

  const { data: gameTypes } = trpc.game.getGameTypes.useQuery();

  const [titleError, setTitleError] = useState("");
  const [lookupIDError, setLookupIDError] = useState("");
  const [gameTypeIdError, setGameTypeIdError] = useState("");

  const addMutation = trpc.game.addGamePointType.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to add point type: " + err.message);
    }
  });

  const updateMutation = trpc.game.updateGamePointType.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      alert("Failed to update point type: " + err.message);
    }
  });

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || "");
      setLookupID(editingItem.lookupID);
      setPoints(editingItem.points);
      setGameTypeId(editingItem.gameTypeId);
    } else {
      resetForm();
      if (defaultGameTypeId) setGameTypeId(defaultGameTypeId);
    }
  }, [editingItem, defaultGameTypeId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLookupID("");
    setPoints(0);
    setGameTypeId(defaultGameTypeId || 0);
    setTitleError("");
    setLookupIDError("");
    setGameTypeIdError("");
  };

  const handleSave = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError("Title is required");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!lookupID.trim()) {
      setLookupIDError("Lookup ID is required");
      isValid = false;
    } else {
      setLookupIDError("");
    }

    if (gameTypeId === 0) {
      setGameTypeIdError("Please select a game type");
      isValid = false;
    } else {
      setGameTypeIdError("");
    }

    if (!isValid) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      lookupID: lookupID.trim(),
      points,
      gameTypeId,
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
          <DialogTitle>{editingItem ? "Edit Point Type" : "Add New Point Type"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="gameType">Game Type</Label>
            <Select
              value={gameTypeId === 0 ? "" : gameTypeId.toString()}
              onValueChange={(val) => {
                const parsed = parseInt(val, 10);
                if (!Number.isNaN(parsed)) {
                  setGameTypeId(parsed);
                } else {
                  setGameTypeId(0);
                }
              }}
            >
              <SelectTrigger id="gameTypeId" className={gameTypeIdError ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a game type" />
              </SelectTrigger>
              <SelectContent>
                {gameTypes?.map(gt => (
                  <SelectItem key={gt.id} value={gt.id.toString()}>{gt.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gameTypeIdError && <p className="text-xs text-destructive">{gameTypeIdError}</p>}
          </div>
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
            <Label htmlFor="points">Points Value</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPoints(0);
                } else {
                  const parsed = parseInt(val, 10);
                  setPoints(Number.isNaN(parsed) ? 0 : parsed);
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Point Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GamePointTypeModal;
