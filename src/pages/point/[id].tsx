import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState, useEffect } from "react";
import { Trash2, Save, ArrowLeft, Trophy, Calendar, Info, User as UserIcon, Plus, Search } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import Link from "next/link";
import { ConfirmModal } from "../../components/ui/confirm-modal";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import debounce from "lodash.debounce";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = await ssr.isAdmin(session?.user?.id || "");

  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}

const PointEditPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const router = useRouter();
  const { id } = router.query;
  const pointId = id as string;

  const { data: point, isLoading, refetch } = trpc.point.get.useQuery({ id: pointId }, { enabled: !!pointId });
  const { data: gamePointTypes } = trpc.game.getAllGamePointTypes.useQuery();

  const updatePoint = trpc.point.update.useMutation({
    onSuccess: () => {
      toast.success("Point updated successfully");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to update point: " + err.message);
    }
  });

  const removePoint = trpc.point.remove.useMutation({
    onSuccess: () => {
      toast.success("Point removed successfully");
      router.back();
    },
    onError: (err) => {
      toast.error("Failed to remove point: " + err.message);
    }
  });

  const addAssignment = trpc.point.addAssignment.useMutation({
    onSuccess: () => {
      toast.success("Assignment linked successfully");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to link assignment: " + err.message);
    }
  });

  const removeAssignment = trpc.point.removeAssignment.useMutation({
    onSuccess: () => {
      toast.success("Assignment unlinked successfully");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to unlink assignment: " + err.message);
    }
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [reason, setReason] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [gamePointTypeId, setGamePointTypeId] = useState<string>("null");

  // Assignment Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { refetch: searchAssignments, isFetching: isSearching } = trpc.assignment.search.useQuery(
    { query: searchQuery },
    { enabled: false }
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
       const result = await searchAssignments();
       if (result.data) setSearchResults(result.data);
    } else {
        setSearchResults([]);
    }
  };

  // Debounce the search
  const debouncedSearch = debounce(handleSearch, 300);


  useEffect(() => {
    if (point) {
      setReason(point.reason || "");
      setAdjustment(point.adjustment || 0);
      setGamePointTypeId(point.gamePointTypeId?.toString() || "null");
    }
  }, [point]);

  const handleSave = () => {
    updatePoint.mutate({
      id: pointId,
      reason,
      adjustment,
      gamePointTypeId: gamePointTypeId === "null" ? null : parseInt(gamePointTypeId),
    });
  };

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!point) return <div className="p-8 text-center text-destructive">Point not found</div>;

  return (
    <>
      <Head>
        <title>Edit Point - Admin</title>
      </Head>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Point Record</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Point Details</CardTitle>
                <CardDescription>Modify the values for this specific point entry.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason / Description</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Manual Adjustment"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adjustment">Adjustment (Extra Pts)</Label>
                    <Input
                      id="adjustment"
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Game Point Type</Label>
                    <Select value={gamePointTypeId} onValueChange={setGamePointTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">None / Manual</SelectItem>
                        {gamePointTypes?.map(type => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.title} ({type.points} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t">
                  <div className="text-2xl font-black text-primary">
                    Total: {((gamePointTypes?.find(t => t.id.toString() === gamePointTypeId)?.points || 0) + adjustment)} pts
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Linked Assignments</CardTitle>
                        <CardDescription>Assignments directly linked to this point.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" /> Link Assignment
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Search Assignments</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Find assignments to link to this point.
                                    </p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search movie, episode..."
                                        className="pl-8"
                                        onChange={(e) => debouncedSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-1">
                                    {isSearching && <div className="text-xs text-center p-2 text-muted-foreground">Searching...</div>}
                                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                        <div className="text-xs text-center p-2 text-muted-foreground">No assignments found</div>
                                    )}
                                    {searchResults.map((assignment) => (
                                        <Button
                                            key={assignment.id}
                                            variant="ghost"
                                            className="w-full justify-start text-left h-auto py-2 px-2"
                                            onClick={() => {
                                                addAssignment.mutate({ pointId, assignmentId: assignment.id });
                                                // Optional: Close popover or clear search
                                            }}
                                        >
                                            <div className="flex flex-col gap-0.5 w-full">
                                                <span className="font-medium text-xs line-clamp-1">{assignment.movie.title}</span>
                                                <span className="text-[10px] text-muted-foreground flex justify-between w-full">
                                                    <span>Ep {assignment.episode.number}</span>
                                                    <span>{assignment.user.name}</span>
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    {point.assignmentPoints.map((ap) => (
                        <div key={ap.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{ap.assignment.movie.title}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Episode {ap.assignment.episode.number}: {ap.assignment.episode.title}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/assignment/${ap.assignment.id}`}>
                                    <Button variant="ghost" size="icon" title="View Assignment">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeAssignment.mutate({ pointId, assignmentId: ap.assignment.id })}
                                    title="Unlink Assignment"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {point.assignmentPoints.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground italic text-sm">
                            No linked assignments
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked Activity</CardTitle>
                <CardDescription>Historical activity associated with this point.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {point.guesses.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Guess: {g.assignmentReview.assignment.movie.title}</span>
                      </div>
                      <Link href={`/assignment/${g.assignmentReview.assignment.id}`}>
                        <Button variant="link" size="sm">View Assignment</Button>
                      </Link>
                    </div>
                  ))}
                  {point.tagVotes.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Tag Vote: {v.tag}</span>
                      </div>
                      <Link href={`/tag?name=${encodeURIComponent(v.tag)}`}>
                        <Button variant="link" size="sm">View Tags</Button>
                      </Link>
                    </div>
                  ))}
                  {point.guesses.length === 0 && point.tagVotes.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground italic text-sm">
                      No linked activity (Manual point)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">User</Label>
                  <Link href={`/user/${point.userId}`} className="flex items-center gap-2 hover:bg-muted p-2 rounded transition-colors bg-muted/50">
                    <UserIcon className="h-4 w-4" />
                    <span className="text-sm font-bold">{point.user.name || point.user.email}</span>
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Season</Label>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50 font-medium text-sm">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    {point.season.title}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Earned On</Label>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50 font-medium text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(point.earnedOn).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          removePoint.mutate({ id: pointId });
          setIsConfirmOpen(false);
        }}
        title="Delete Point Record"
        description="Are you sure you want to delete this point record? This will unlink it from any associated guesses or activity."
      />
    </>
  );
};

export default PointEditPage;
