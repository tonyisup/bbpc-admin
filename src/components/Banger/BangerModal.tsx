import { DispatchWithoutAction, FC, useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [titleError, setTitleError] = useState("");
  const [artistError, setArtistError] = useState("");
  const [urlError, setUrlError] = useState("");

  const { data: episodes } = trpc.episode.getAll.useQuery();
  const { data: users } = trpc.user.getAll.useQuery();

  const addMutation = trpc.banger.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
      toast.success("Banger added successfully!");
    },
    onError: (err) => {
      toast.error("Failed to add banger: " + err.message);
    },
  });

  const updateMutation = trpc.banger.update.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      resetForm();
      toast.success("Banger updated successfully!");
    },
    onError: (err) => {
      toast.error("Failed to update banger: " + err.message);
    },
  });

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setArtist(editingItem.artist);
      setUrl(editingItem.url);
      setEpisodeId(editingItem.episodeId || null);
      setUserId(editingItem.userId || null);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setTitle("");
    setArtist("");
    setUrl("");
    setEpisodeId(null);
    setUserId(null);
    setTitleError("");
    setArtistError("");
    setUrlError("");
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();
    const trimmedUrl = url.trim();

    let isValid = true;
    if (!trimmedTitle) {
      setTitleError("Title is required");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!trimmedArtist) {
      setArtistError("Artist is required");
      isValid = false;
    } else {
      setArtistError("");
    }

    if (!trimmedUrl) {
      setUrlError("URL is required");
      isValid = false;
    } else {
      try {
        new URL(trimmedUrl);
        setUrlError("");
      } catch {
        setUrlError("Invalid URL format");
        isValid = false;
      }
    }

    if (!isValid) return;

    const data = {
      title: trimmedTitle,
      artist: trimmedArtist,
      url: trimmedUrl,
      episodeId: (episodeId === "" || episodeId === null) ? null : episodeId,
      userId: (userId === "" || userId === null) ? null : userId,
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
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={titleError ? "border-destructive" : ""}
            />
            {titleError && <p className="text-xs text-destructive">{titleError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className={artistError ? "border-destructive" : ""}
            />
            {artistError && <p className="text-xs text-destructive">{artistError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">Spotify/URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Episode (Optional)</Label>
            <Select value={episodeId || ""} onValueChange={(val) => setEpisodeId(val || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an episode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {episodes?.map(ep => (
                  <SelectItem key={ep.id} value={ep.id}>Ep {ep.number}: {ep.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>User (Optional)</Label>
            <Select value={userId || ""} onValueChange={(val) => setUserId(val || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
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
