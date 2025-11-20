import { type DispatchWithoutAction, type FC, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus } from "lucide-react";

interface AddEpisodeModalProps {
  refreshItems: DispatchWithoutAction
}

const AddEpisodeModal: FC<AddEpisodeModalProps> = ({ refreshItems }) => {
  const [open, setOpen] = useState(false);
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
  const [episodeTitle, setEpisodeTitle] = useState<string>("");

  const { mutate: addEpisode, isLoading } = trpc.episode.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setOpen(false);
      setEpisodeNumber("");
      setEpisodeTitle("");
    }
  });

  const handleAddEpisode = () => {
    if (episodeNumber && episodeTitle) {
      addEpisode({ number: Number(episodeNumber), title: episodeTitle });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Episode
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Episode</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="number">Episode Number</Label>
            <Input
              id="number"
              type="number"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.valueAsNumber || "")}
              placeholder="101"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
              placeholder="Episode Title"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddEpisode} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Episode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEpisodeModal;
