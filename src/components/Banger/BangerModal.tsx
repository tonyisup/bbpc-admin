import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Banger } from "@prisma/client";

interface BangerModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshItems: DispatchWithoutAction;
  editingItem?: Banger | null;
}

const BangerModal: FC<BangerModalProps> = ({ open, setOpen, refreshItems, editingItem }) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [episodeId, setEpisodeId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const { data: episodes } = trpc.episode.getAll.useQuery();
  const { data: users } = trpc.user.getAll.useQuery();

  const addMutation = trpc.banger.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = trpc.banger.update.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
    },
  });

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setArtist(editingItem.artist);
      setUrl(editingItem.url);
      setEpisodeId(editingItem.episodeId || undefined);
      setUserId(editingItem.userId || undefined);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setTitle("");
    setArtist("");
    setUrl("");
    setEpisodeId(undefined);
    setUserId(undefined);
  };

  const handleSave = () => {
    const data = {
      title,
      artist,
      url,
      episodeId: episodeId === "none" ? undefined : episodeId,
      userId: userId === "none" ? undefined : userId,
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
          <DialogTitle>{editingItem ? "Edit Banger" : "Add New Banger"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Song Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="artist">Artist</Label>
            <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">Spotify/URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Episode (Optional)</Label>
            <Select value={episodeId || "none"} onValueChange={(val) => setEpisodeId(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an episode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {episodes?.map(ep => (
                  <SelectItem key={ep.id} value={ep.id}>Ep {ep.number}: {ep.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>User (Optional)</Label>
            <Select value={userId || "none"} onValueChange={(val) => setUserId(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {users?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Banger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BangerModal;
