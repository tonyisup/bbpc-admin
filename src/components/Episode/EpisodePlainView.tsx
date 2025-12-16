import React from 'react';
import { trpc } from "../../utils/trpc";
import { Button } from "../ui/button";
import { HiOutlineClipboardCopy } from "react-icons/hi";

interface EpisodePlainViewProps {
  episodeId: string;
  episodeNumber: number;
}

const EpisodePlainView: React.FC<EpisodePlainViewProps> = ({ episodeId, episodeNumber }) => {
  const { data: episode } = trpc.episode.full.useQuery({ id: episodeId });
  const { data: next } = trpc.episode.fullByNumber.useQuery({ number: 1 + episodeNumber })

  const handleCopyToClipboard = () => {
    const text = document.getElementById('episode-data')?.innerText ?? '';
    navigator.clipboard.writeText(text);
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
        {episode.Assignments.map(assignment => {
            return <div key={assignment.id}>
            {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
            </div>
        })} <br />
        Extras: <br />
        {episode.Extras.map(extra => {
            return <div key={extra.id}>
            [{extra.Review.User?.name}] {extra.Review.Movie?.title} ({extra.Review.Movie?.year})
            </div>
        })} <br />
        {next?.title}:<br />
        {next && next.Assignments.sort((a, b) => a.type === 'HOMEWORK' && b.type !== 'HOMEWORK' ? -1 : 1).map(assignment => {
            return <div key={assignment.id}>
            {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
            </div>
        })} <br />
      </pre>
    </section>
  );
};

export default EpisodePlainView;
