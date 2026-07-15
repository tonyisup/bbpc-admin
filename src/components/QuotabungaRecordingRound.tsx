import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Quote, Trophy } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "../utils/trpc";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface QuotabungaRecordingRoundProps {
  episodeId: string;
}

export function QuotabungaRecordingRound({ episodeId }: QuotabungaRecordingRoundProps) {
  const utils = trpc.useContext();
  const submissions = trpc.quotabunga.list.useQuery({ episodeId });
  const included = useMemo(
    () => (submissions.data ?? []).filter((submission) => submission.status === "INCLUDED"),
    [submissions.data]
  );
  const [placements, setPlacements] = useState<Record<string, string>>({});

  useEffect(() => {
    setPlacements(Object.fromEntries(
      included
        .filter((submission) => submission.placement)
        .map((submission) => [submission.id, String(submission.placement)])
    ));
  }, [included]);

  const award = trpc.quotabunga.awardPlacements.useMutation({
    onSuccess: async ({ awarded }) => {
      await Promise.all([
        utils.quotabunga.list.invalidate({ episodeId }),
        utils.season.getUserSummary.invalidate(),
      ]);
      toast.success(`Saved ${awarded} Quotabunga result${awarded === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const saveResults = () => {
    award.mutate({
      episodeId,
      placements: Object.entries(placements)
        .filter(([, placement]) => placement)
        .map(([submissionId, placement]) => ({ submissionId, placement: Number(placement) })),
    });
  };

  return (
    <Card className="w-full max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <Quote className="h-5 w-5 text-primary" />
          Quotabunga ({included.length} included)
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quotabunga?episodeId=${episodeId}`}>Manage round</Link>
          </Button>
          <Button size="sm" onClick={saveResults} disabled={!included.length || award.isLoading}>
            {award.isLoading ? <Loader2 className="animate-spin" /> : <Trophy className="h-4 w-4" />}
            Award points
          </Button>
        </div>
      </div>

      {submissions.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
      ) : included.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No entries have been included for this round yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {included.map((submission) => (
            <div key={submission.id} className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <span>Matchup #{submission.bracketOrder ?? "—"}</span>
                <span>{submission.user.name ?? submission.user.email}</span>
              </div>
              <blockquote className="flex-1 whitespace-pre-wrap text-lg font-medium">
                &ldquo;{submission.quoteText}&rdquo;
              </blockquote>
              <p className="text-sm text-muted-foreground">{submission.sourceTitle} · {submission.sourceType}</p>
              {submission.listenerNotes && <p className="rounded-md bg-background/60 p-2 text-sm text-muted-foreground">{submission.listenerNotes}</p>}
              {submission.clipUrl && (
                <a href={submission.clipUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline">
                  Open clip{submission.clipStartSeconds !== null ? ` at ${submission.clipStartSeconds}s` : ""}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <select
                aria-label={`Placement for ${submission.user.name ?? submission.sourceTitle}`}
                value={placements[submission.id] ?? ""}
                onChange={(event) => setPlacements((current) => ({ ...current, [submission.id]: event.target.value }))}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">No placement</option>
                <option value="1">1st · 40 points</option>
                <option value="2">2nd · 20 points</option>
                <option value="3">3rd · 10 points</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
