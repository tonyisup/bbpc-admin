import React, { useState, useEffect } from 'react';
import { trpc } from "../../utils/trpc";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { HiOutlineClipboardCopy, HiOutlineInformationCircle } from "react-icons/hi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EpisodePlainViewProps {
  episodeId: string;
  episodeNumber: number;
}

const EpisodePlainView: React.FC<EpisodePlainViewProps> = ({ episodeId, episodeNumber }) => {
  const { data: episode, refetch } = trpc.episode.full.useQuery({ id: episodeId });
  const { data: next } = trpc.episode.fullByNumber.useQuery({ number: 1 + episodeNumber })
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (episode?.notes) {
      setNotes(episode.notes);
    }
  }, [episode]);

  const { mutate: updateNotes, isLoading: isSaving } = trpc.episode.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes saved");
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to save notes: ${err.message}`);
    }
  });

  const handleCopyToClipboard = () => {
    const text = document.getElementById('episode-data')?.innerText ?? '';
    navigator.clipboard.writeText(text);
  }

  const handleSaveNotes = () => {
    updateNotes({ id: episodeId, notes });
  }

  if (!episode) return <div className="p-4 border rounded-md w-full max-w-4xl text-center">Loading Plain Text View...</div>;

  return (
    <section className="flex flex-col gap-2 w-full max-w-4xl p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Plain Text View</h2>
        <Button variant="ghost" size="icon" title="Copy to Clipboard" onClick={handleCopyToClipboard}>
          <HiOutlineClipboardCopy className="h-4 w-4" />
        </Button>
      </div>

      <pre id="episode-data" className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto font-mono">
        {episode.assignments.map(assignment => {
          return <div key={assignment.id}>
            {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.user.name}] {assignment.movie?.title} ({assignment.movie?.year})
          </div>
        })} <br />
        Extras: <br />
        {episode.extras.map(extra => {
          return <div key={extra.id}>
            [{extra.review.user?.name}] {extra.review.movie?.title} ({extra.review.movie?.year})
          </div>
        })} <br />
        {next?.title}:<br />
        {next && next.assignments.sort((a, b) => a.type === 'HOMEWORK' && b.type !== 'HOMEWORK' ? -1 : 1).map(assignment => {
          return <div key={assignment.id}>
            {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.user.name}] {assignment.movie?.title} ({assignment.movie?.year})
          </div>
        })} <br />
      </pre>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <HiOutlineInformationCircle className="h-4 w-4" />
            Admin Notes (Internal)
          </h3>
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={isSaving || notes === (episode.notes ?? "")}
            className="h-8"
          >
            {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Notes
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes for this episode (only visible in admin portal)"
          className="min-h-[150px] bg-amber-500/5 border-amber-500/20 focus-visible:ring-amber-500/30"
        />
      </div>
    </section>
  );
};

export default EpisodePlainView;
