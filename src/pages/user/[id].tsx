import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import router, { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { X, Trash2, ArrowUp, ArrowDown, User as UserIcon, Mail, Shield, Trophy, History, BookOpen, Settings, Save, Plus } from "lucide-react";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableCell, TableRow, TableHeader, TableBody } from "@/components/ui/table";
import { AddPointPopover } from "@/components/AddPointPopover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const isAdmin = await ssr.isAdmin(session?.user?.id || "");
  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  return {
    props: {
      session
    }
  }
}

const UserPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { query } = useRouter();
  const id = query.id as string;
  const { data: user, refetch: refetchUser } = trpc.user.get.useQuery({ id });
  const { data: userRoles, refetch: refetchRoles } = trpc.user.getRoles.useQuery({ id });
  const { data: syllabus, refetch: refetchSyllabus } = trpc.user.getSyllabus.useQuery({ id });
  const { data: currentSeason } = trpc.guess.currentSeason.useQuery();

  const { data: totalPoints, refetch: refetchTotalPoints } = trpc.user.getTotalPointsForSeason.useQuery({ userId: id });
  const { data: guesses, refetch: refetchGuesses } = trpc.guess.getForUser.useQuery({ userId: id });
  const { data: gamblingPoints, refetch: refetchGamblingPoints } = trpc.gambling.getForUser.useQuery({ userId: id });
  const { data: points, refetch: refetchPoints } = trpc.user.getPoints.useQuery({ id });

  const form = useForm<z.infer<typeof formSchema>>({
    values: {
      name: user?.name ?? '',
      email: user?.email ?? ''
    },
    resolver: zodResolver(formSchema),
  });

  const refreshAllPoints = () => {
    refetchTotalPoints();
    refetchPoints();
    refetchGuesses();
    refetchGamblingPoints();
  }

  const { mutate: updateUser } = trpc.user.update.useMutation({
    onSuccess: () => refetchUser(),
  });

  const { mutate: removeRole } = trpc.user.removeRole.useMutation({
    onSuccess: () => refetchRoles(),
  });

  const { mutate: assignEpisode } = trpc.syllabus.assignEpisode.useMutation({
    onSuccess: () => refetchSyllabus(),
  });

  const { mutate: removePoint } = trpc.user.removePoint.useMutation({
    onSuccess: () => refreshAllPoints(),
  });

  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const { mutate: removeAssignment } = trpc.syllabus.removeEpisodeFromSyllabusItem.useMutation({
    onSuccess: () => refetchSyllabus(),
  });

  const handleRemoveAssignment = (syllabusId: string) => {
    removeAssignment({ syllabusId });
  };


  const { mutate: reorderSyllabus } = trpc.user.reorderSyllabus.useMutation({
    onSuccess: () => refetchSyllabus(),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateUser({ id, name: data.name, email: data.email });
  }

  const handleAssignEpisode = (syllabusId: string, episodeNumber: number, assignmentType: string) => {
    assignEpisode({ syllabusId, episodeNumber, assignmentType });
  }

  const handleMoveUp = (index: number) => {
    if (!syllabus || index === 0) return;
    const itemToMove = syllabus[index];
    const itemAbove = syllabus[index - 1];
    if (!itemToMove || !itemAbove) return;
    reorderSyllabus([
      { id: itemToMove.id, order: itemAbove.order },
      { id: itemAbove.id, order: itemToMove.order }
    ]);
  };

  const handleMoveDown = (index: number) => {
    if (!syllabus || index === syllabus.length - 1) return;
    const itemToMove = syllabus[index];
    const itemBelow = syllabus[index + 1];
    if (!itemToMove || !itemBelow) return;
    reorderSyllabus([
      { id: itemToMove.id, order: itemBelow.order },
      { id: itemBelow.id, order: itemToMove.order }
    ]);
  };

  const groupedPoints = useMemo(() => {
    const acc: any = { general: { otherPoints: [] } };

    points?.forEach((point: any) => {
      const episode = point.guesses?.[0]?.assignmentReview?.assignment?.episode
        || point.gamblingPoints?.[0]?.assignment?.episode
        || point.assignmentPoints?.[0]?.assignment?.episode;

      const assignment = point.guesses?.[0]?.assignmentReview?.assignment
        || point.gamblingPoints?.[0]?.assignment
        || point.assignmentPoints?.[0]?.assignment;

      if (episode) {
        if (!acc[episode.id]) {
          acc[episode.id] = { episode, assignments: {}, otherPoints: [] };
        }

        if (assignment) {
          if (!acc[episode.id].assignments[assignment.id]) {
            acc[episode.id].assignments[assignment.id] = { assignment, points: [] };
          }
          acc[episode.id].assignments[assignment.id].points.push(point);
        } else {
          acc[episode.id].otherPoints.push(point);
        }
      } else {
        acc['general'].otherPoints.push(point);
      }
    });

    // Add un-pointed guesses
    guesses?.filter((g: any) => !g.point).forEach((guess: any) => {
      const episode = guess.assignmentReview.assignment.episode;
      const assignment = guess.assignmentReview.assignment;

      if (episode) {
        if (!acc[episode.id]) {
          acc[episode.id] = { episode, assignments: {}, otherPoints: [] };
        }
        if (assignment) {
          if (!acc[episode.id].assignments[assignment.id]) {
            acc[episode.id].assignments[assignment.id] = { assignment, points: [] };
          }
          acc[episode.id].assignments[assignment.id].points.push({
            id: `guess-${guess.id}`,
            isGuess: true,
            guess: guess,
            earnedOn: guess.created,
            reason: 'Pending Guess',
            gamePointType: { points: 0, title: 'Guess' },
            adjustment: 0
          });
        }
      }
    });

    return acc;
  }, [points, guesses]);

  const sortedEpisodeKeys = useMemo(() => {
    return Object.keys(groupedPoints || {})
      .filter(k => k !== 'general')
      .sort((a, b) => (groupedPoints?.[b]?.episode?.number ?? 0) - (groupedPoints?.[a]?.episode?.number ?? 0));
  }, [groupedPoints]);

  return (
    <>
      <Head>
        <title>{user?.name || user?.email} - Admin</title>
      </Head>

      {modalOpen && <UserRoleModal userId={id} setModalOpen={setModalOpen} refresh={refetchRoles} />}

      <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback className="bg-primary/5 text-primary">
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user?.name || "Anonymous User"}</h1>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm italic">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Total Points</span>
              <span className="text-2xl font-black text-primary">{totalPoints ?? 0}</span>
            </div>
            <Trophy className="h-8 w-8 text-primary/40" />
          </div>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="activity" className="gap-2 text-xs sm:text-sm"><History className="h-4 w-4" /> Activity</TabsTrigger>
            <TabsTrigger value="syllabus" className="gap-2 text-xs sm:text-sm"><BookOpen className="h-4 w-4" /> Syllabus</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-xs sm:text-sm"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Point Events Timeline */}
              <Card className="lg:col-span-2 shadow-none border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Point Events</CardTitle>
                    <CardDescription>History of earned points by episode</CardDescription>
                  </div>
                  {currentSeason && (
                    <AddPointPopover userId={id} seasonId={currentSeason.id} onSuccess={refreshAllPoints} />
                  )}
                </CardHeader>
                <CardContent className="space-y-6 mt-4">
                  {sortedEpisodeKeys.length === 0 && !groupedPoints['general'].otherPoints.length && (
                    <div className="text-center py-12 text-muted-foreground italic">No point events recorded yet.</div>
                  )}

                  {sortedEpisodeKeys.map(episodeId => {
                    const group = groupedPoints[episodeId];
                    return (
                      <div key={episodeId} className="relative pl-6 pb-6 border-l-2 border-primary/20 last:border-0 last:pb-0">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-primary uppercase tracking-tight">Episode {group.episode.number}</h3>
                          <p className="text-lg font-bold">{group.episode.title}</p>
                        </div>

                        <div className="space-y-3">
                          {Object.values(group.assignments).map((assignmentGroup: any) => (
                            <div key={assignmentGroup.assignment.id} className="bg-muted/30 p-4 rounded-lg border border-muted-foreground/10">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                  {assignmentGroup.assignment.type}
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground">{assignmentGroup.assignment.movie?.title}</span>
                              </div>
                              <div className="space-y-2">
                                {assignmentGroup.points.map((point: any) => (
                                  <div key={point.id} className="flex items-center justify-between bg-background/50 p-2.5 rounded border border-muted-foreground/5 transition-colors hover:border-muted-foreground/20">
                                    <div className="flex items-center gap-3">
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${point.isGuess ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        {point.isGuess ? '?' : `+${(point.gamePointType?.points ?? 0) + (point.adjustment ?? 0)}`}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">{point.reason}</span>
                                        <span className="text-[10px] text-muted-foreground/70">{point.gamePointType?.title} • {point.earnedOn ? new Date(point.earnedOn).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                    {!point.isGuess && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePoint({ id: point.id })}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {groupedPoints['general'].otherPoints.length > 0 && (
                    <div className="relative pl-6 border-l-2 border-muted/50">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground border-4 border-background" />
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tight mb-4">Other Points</h3>
                      <div className="space-y-2">
                        {groupedPoints['general'].otherPoints.map((point: any) => (
                          <div key={point.id} className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-transparent hover:border-muted-foreground/10">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{point.reason}</span>
                              <span className="text-[10px] text-muted-foreground">{point.gamePointType?.title} • {point.earnedOn ? new Date(point.earnedOn).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sm">{(point.gamePointType?.points ?? 0) + (point.adjustment ?? 0)}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePoint({ id: point.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* History Tables */}
              <div className="space-y-6">
                <Card className="shadow-none border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Gambling History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[10px] uppercase font-bold px-4">Movie</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold text-right px-4">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gamblingPoints?.slice(0, 10).map((gp: any) => (
                          <TableRow key={gp.id} className="text-xs">
                            <TableCell className="py-2 px-4">
                              <div className="font-medium truncate max-w-[120px]">{gp.assignment?.movie?.title}</div>
                              <div className="text-[9px] text-muted-foreground italic">Ep {gp.assignment?.episode?.number}</div>
                            </TableCell>
                            <TableCell className="py-2 px-4 text-right">
                              <span className={gp.successful ? "text-green-600 font-bold" : "text-destructive"}>
                                {gp.successful ? "+" : "-"}{gp.points}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!gamblingPoints || gamblingPoints.length === 0) && (
                          <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-[10px] italic">No gambling history</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="shadow-none border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Guess History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[10px] uppercase font-bold px-4">Movie</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold text-right px-4">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guesses?.slice(0, 10).map((g: any) => (
                          <TableRow key={g.id} className="text-xs">
                            <TableCell className="py-2 px-4">
                              <div className="font-medium truncate max-w-[120px]">{g.assignmentReview.assignment.movie.title}</div>
                              <div className="text-[9px] text-muted-foreground">Rating: {g.rating?.value}</div>
                            </TableCell>
                            <TableCell className="py-2 px-4 text-right font-bold">
                              {g.point?.gamePointType?.points ?? 0}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!guesses || guesses.length === 0) && (
                          <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-[10px] italic">No guess history</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="syllabus" className="space-y-6">
            <Card className="shadow-none border bg-card">
              <CardHeader>
                <CardTitle>User Syllabus</CardTitle>
                <CardDescription>Manage future movie assignments for {user?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {syllabus?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-lg">
                    Syllabus is empty.
                  </div>
                )}
                <div className="space-y-3">
                  {syllabus?.map((item: any, index: number) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-muted-foreground/10 group">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 group-hover:opacity-100" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 group-hover:opacity-100" onClick={() => handleMoveDown(index)} disabled={index === (syllabus?.length || 0) - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-muted-foreground/50 border rounded px-1.5 py-0.5 bg-background">#{item.order}</span>
                          <h3 className="font-bold truncate">{item.movie.title}</h3>
                          <span className="text-xs text-muted-foreground font-medium">({item.movie.year})</span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic text-left">"{item.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.assignment ? (
                          <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                            <span className="text-[10px] font-black text-primary uppercase">Ep {item.assignment.episode?.number}</span>
                            <Separator orientation="vertical" className="h-3 bg-primary/20" />
                            <button className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveAssignment(item.id)}>
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Input
                              type="number"
                              placeholder="Ep #"
                              className="w-16 h-8 text-xs"
                              id={`episode-${item.id}`}
                            />
                            <select className="h-8 text-[10px] rounded-md border border-input bg-background px-2 py-1 font-bold uppercase tracking-wider" id={`assignment-type-${item.id}`}>
                              <option value="HOMEWORK">Homework</option>
                              <option value="EXTRA_CREDIT">Extra</option>
                              <option value="BONUS">Bonus</option>
                            </select>
                            <Button size="sm" className="h-8 text-xs font-bold" onClick={() => {
                              const epNum = parseInt((document.getElementById(`episode-${item.id}`) as HTMLInputElement).value);
                              const type = (document.getElementById(`assignment-type-${item.id}`) as HTMLSelectElement).value;
                              if (!isNaN(epNum)) handleAssignEpisode(item.id, epNum, type);
                            }}>Assign</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Account Details */}
              <Card className="shadow-none border bg-card">
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Update name and email address</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground" htmlFor="name">Full Name</label>
                      <Input id="name" {...form.register("name")} />
                      {form.formState.errors.name && <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground" htmlFor="email">Email Address</label>
                      <Input id="email" {...form.register("email")} />
                      {form.formState.errors.email && <p className="text-xs text-destructive font-medium">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                      <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                      <Button type="submit" className="gap-2">
                        <Save className="h-4 w-4" /> Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Roles Management */}
              <Card className="shadow-none border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 text-left">
                  <div className="text-left w-full">
                    <CardTitle>Permissions & Roles</CardTitle>
                    <CardDescription>Assign administrative or special roles</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userRoles?.length === 0 && <p className="text-sm text-muted-foreground italic">No roles assigned.</p>}
                    {userRoles?.map((userRole: any) => (
                      <div key={userRole.id} className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-colors hover:bg-primary/10">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold uppercase tracking-tight">{userRole.role?.name}</span>
                        <Separator orientation="vertical" className="h-3 bg-primary/30 mx-1" />
                        <button onClick={() => removeRole({ id: userRole.id })} className="text-primary/50 hover:text-destructive transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="bg-muted/50 p-4 rounded-lg border border-muted-foreground/5">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Security Note</h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                      Roles grant access to various admin panels. Removing the 'Admin' role will immediately revoke this user's access to this management dashboard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default UserPage;