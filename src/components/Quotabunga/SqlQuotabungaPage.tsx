/* eslint-disable @typescript-eslint/no-misused-promises */
import Head from "next/head";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Quote,
  Shuffle,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { AppRouter } from "../../server/trpc/router/_app";
import { trpc } from "../../utils/trpc";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Submission = RouterOutput["quotabunga"]["list"][number];
type SourceType = "MOVIE" | "TV" | "OTHER";

const emptyForm = {
  userId: "",
  quoteText: "",
  sourceTitle: "",
  sourceType: "MOVIE" as SourceType,
  clipUrl: "",
  clipStartSeconds: "",
  listenerNotes: "",
  adminNotes: "",
};

const SqlQuotabungaPage = () => {
  const utils = trpc.useContext();
  const router = useRouter();
  const episodes = trpc.quotabunga.getEpisodes.useQuery();
  const users = trpc.user.getAll.useQuery();
  const [episodeId, setEpisodeId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [placements, setPlacements] = useState<Record<string, string>>({});

  useEffect(() => {
    if (episodeId) return;
    const requestedEpisodeId = typeof router.query.episodeId === "string" ? router.query.episodeId : "";
    if (requestedEpisodeId) {
      setEpisodeId(requestedEpisodeId);
      return;
    }
    if (!episodes.data?.length) return;
    const preferred = episodes.data.find((episode) => episode.status === "next")
      ?? episodes.data.find((episode) => episode.status === "recording")
      ?? episodes.data[0];
    if (preferred) setEpisodeId(preferred.id);
  }, [episodeId, episodes.data, router.query.episodeId]);

  const submissions = trpc.quotabunga.list.useQuery(
    { episodeId },
    { enabled: !!episodeId }
  );

  useEffect(() => {
    if (!submissions.data) return;
    setPlacements(Object.fromEntries(
      submissions.data
        .filter((submission) => submission.placement)
        .map((submission) => [submission.id, String(submission.placement)])
    ));
  }, [submissions.data]);

  const invalidate = async () => {
    await Promise.all([
      utils.quotabunga.list.invalidate({ episodeId }),
      utils.quotabunga.getEpisodes.invalidate(),
      utils.season.getUserSummary.invalidate(),
    ]);
  };

  const setStatus = trpc.quotabunga.setStatus.useMutation({
    onSuccess: () => void invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const randomize = trpc.quotabunga.randomize.useMutation({
    onSuccess: ({ count }) => {
      void invalidate();
      toast.success(`Randomized ${count} included entries`);
    },
    onError: (error) => toast.error(error.message),
  });
  const award = trpc.quotabunga.awardPlacements.useMutation({
    onSuccess: ({ awarded }) => {
      void invalidate();
      toast.success(`Saved ${awarded} Quotabunga result${awarded === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.quotabunga.remove.useMutation({
    onSuccess: () => {
      void invalidate();
      toast.success("Submission removed");
    },
    onError: (error) => toast.error(error.message),
  });
  const create = trpc.quotabunga.createForUser.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      void invalidate();
      toast.success("Submission added");
    },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.quotabunga.update.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      void invalidate();
      toast.success("Submission updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const visibleSubmissions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (submissions.data ?? []).filter((submission) => {
      if (statusFilter !== "ALL" && submission.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        submission.quoteText,
        submission.sourceTitle,
        submission.user.name,
        submission.user.email,
      ].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [search, statusFilter, submissions.data]);

  const counts = useMemo(() => ({
    all: submissions.data?.length ?? 0,
    submitted: submissions.data?.filter((submission) => submission.status === "SUBMITTED").length ?? 0,
    included: submissions.data?.filter((submission) => submission.status === "INCLUDED").length ?? 0,
    rejected: submissions.data?.filter((submission) => submission.status === "REJECTED").length ?? 0,
  }), [submissions.data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (submission: Submission) => {
    setEditing(submission);
    setForm({
      userId: submission.userId,
      quoteText: submission.quoteText,
      sourceTitle: submission.sourceTitle,
      sourceType: submission.sourceType as SourceType,
      clipUrl: submission.clipUrl ?? "",
      clipStartSeconds: submission.clipStartSeconds?.toString() ?? "",
      listenerNotes: submission.listenerNotes ?? "",
      adminNotes: submission.adminNotes ?? "",
    });
    setModalOpen(true);
  };

  const saveSubmission = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = {
      quoteText: form.quoteText,
      sourceTitle: form.sourceTitle,
      sourceType: form.sourceType,
      clipUrl: form.clipUrl,
      clipStartSeconds: form.clipStartSeconds ? Number(form.clipStartSeconds) : null,
      listenerNotes: form.listenerNotes,
    };

    if (editing) {
      update.mutate({ ...content, id: editing.id, adminNotes: form.adminNotes });
    } else {
      create.mutate({ ...content, episodeId, userId: form.userId });
    }
  };

  const savePlacements = () => {
    award.mutate({
      episodeId,
      placements: Object.entries(placements)
        .filter(([, placement]) => placement)
        .map(([submissionId, placement]) => ({ submissionId, placement: Number(placement) })),
    });
  };

  return (
    <>
      <Head><title>Quotabunga - BBPC Admin</title></Head>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
              <Quote className="h-8 w-8 text-primary" /> Quotabunga
            </h1>
            <p className="mt-1 text-muted-foreground">Moderate entries, arrange the round, and award results.</p>
          </div>
          <Button onClick={openCreate} disabled={!episodeId}>
            <Plus className="h-4 w-4" /> Add for listener
          </Button>
        </div>

        <Card className="grid gap-4 p-5 lg:grid-cols-[minmax(16rem,1fr)_minmax(14rem,1fr)_auto]">
          <div className="space-y-2">
            <label htmlFor="episode-filter" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Episode</label>
            <select
              id="episode-filter"
              value={episodeId}
              onChange={(event) => setEpisodeId(event.target.value)}
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {episodes.data?.map((episode) => (
                <option key={episode.id} value={episode.id}>
                  #{episode.number} · {episode.title} ({episode._count.quoteSubmissions})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="quote-search" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Search</label>
            <Input id="quote-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Listener, source, or quote..." />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => randomize.mutate({ episodeId })} disabled={!counts.included || randomize.isLoading}>
              {randomize.isLoading ? <Loader2 className="animate-spin" /> : <Shuffle className="h-4 w-4" />}
              Randomize
            </Button>
            <Button onClick={savePlacements} disabled={award.isLoading || !counts.included}>
              {award.isLoading ? <Loader2 className="animate-spin" /> : <Trophy className="h-4 w-4" />}
              Award points
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          {([
            ["ALL", `All ${counts.all}`],
            ["SUBMITTED", `Submitted ${counts.submitted}`],
            ["INCLUDED", `Included ${counts.included}`],
            ["REJECTED", `Rejected ${counts.rejected}`],
          ] as const).map(([value, label]) => (
            <Button key={value} size="sm" variant={statusFilter === value ? "default" : "outline"} onClick={() => setStatusFilter(value)}>
              {label}
            </Button>
          ))}
        </div>

        {submissions.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : visibleSubmissions.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No Quotabunga submissions match this view.</Card>
        ) : (
          <div className="grid gap-4">
            {visibleSubmissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden p-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={submission.status === "INCLUDED" ? "default" : "outline"}>{submission.status}</Badge>
                      {submission.bracketOrder && <Badge variant="outline">Bracket #{submission.bracketOrder}</Badge>}
                      {submission.placement && <Badge variant="outline">Place #{submission.placement} · {submission.point?.adjustment ?? 0} points</Badge>}
                      <span className="text-sm font-semibold">{submission.user.name ?? submission.user.email ?? "Unknown listener"}</span>
                    </div>
                    <blockquote className="whitespace-pre-wrap text-lg font-medium">&ldquo;{submission.quoteText}&rdquo;</blockquote>
                    <p className="text-sm text-muted-foreground">{submission.sourceTitle} · {submission.sourceType}</p>
                    {submission.listenerNotes && <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">Listener: {submission.listenerNotes}</p>}
                    {submission.adminNotes && <p className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-600">Admin: {submission.adminNotes}</p>}
                    {submission.clipUrl && (
                      <a href={submission.clipUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline">
                        Open clip{submission.clipStartSeconds !== null ? ` at ${submission.clipStartSeconds}s` : ""} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    {submission.status === "INCLUDED" && (
                      <div className="space-y-2">
                        <label htmlFor={`placement-${submission.id}`} className="text-xs font-bold uppercase text-muted-foreground">Placement</label>
                        <select
                          id={`placement-${submission.id}`}
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
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {submission.status !== "INCLUDED" && (
                        <Button size="sm" onClick={() => setStatus.mutate({ id: submission.id, status: "INCLUDED" })}>
                          <Check className="h-4 w-4" /> Include
                        </Button>
                      )}
                      {submission.status !== "REJECTED" && (
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: submission.id, status: "REJECTED" })}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      )}
                      {submission.status !== "SUBMITTED" && !submission.pointId && (
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: submission.id, status: "SUBMITTED" })}>
                          Reset
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(submission)} disabled={!!submission.pointId}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Delete this submission and any linked points?")) remove.mutate({ id: submission.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Quotabunga entry" : "Add Quotabunga entry"}</DialogTitle>
            <DialogDescription>{editing ? "Correct submission content or add private notes." : "Import an emailed entry or add one on a listener's behalf."}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveSubmission}>
            {!editing && (
              <div className="space-y-2">
                <label htmlFor="listener" className="text-sm font-semibold">Listener</label>
                <select id="listener" required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Choose a listener...</option>
                  {users.data?.map((user) => <option key={user.id} value={user.id}>{user.name ?? user.email ?? user.id}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="quoteText" className="text-sm font-semibold">Quote or scene</label>
              <Textarea id="quoteText" required maxLength={2000} value={form.quoteText} onChange={(event) => setForm({ ...form, quoteText: event.target.value })} className="min-h-28" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
              <div className="space-y-2">
                <label htmlFor="sourceTitle" className="text-sm font-semibold">Movie or show</label>
                <Input id="sourceTitle" required maxLength={500} value={form.sourceTitle} onChange={(event) => setForm({ ...form, sourceTitle: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label htmlFor="sourceType" className="text-sm font-semibold">Type</label>
                <select id="sourceType" value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as SourceType })} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="MOVIE">Movie</option><option value="TV">Television</option><option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <div className="space-y-2">
                <label htmlFor="clipUrl" className="text-sm font-semibold">Clip URL</label>
                <Input id="clipUrl" type="url" maxLength={2000} value={form.clipUrl} onChange={(event) => setForm({ ...form, clipUrl: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label htmlFor="clipStart" className="text-sm font-semibold">Start second</label>
                <Input id="clipStart" type="number" min={0} max={86400} value={form.clipStartSeconds} onChange={(event) => setForm({ ...form, clipStartSeconds: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="listenerNotes" className="text-sm font-semibold">Listener notes</label>
              <Textarea id="listenerNotes" maxLength={1000} value={form.listenerNotes} onChange={(event) => setForm({ ...form, listenerNotes: event.target.value })} />
            </div>
            {editing && (
              <div className="space-y-2">
                <label htmlFor="adminNotes" className="text-sm font-semibold">Private admin notes</label>
                <Textarea id="adminNotes" maxLength={1000} value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isLoading || update.isLoading || !form.quoteText.trim() || !form.sourceTitle.trim() || (!editing && !form.userId)}>
                {(create.isLoading || update.isLoading) && <Loader2 className="animate-spin" />}
                Save entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SqlQuotabungaPage;
