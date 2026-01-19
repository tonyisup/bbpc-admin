import Link from "next/link";
import { useMemo, useState, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { EditSeasonForm } from "./EditSeasonForm";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { type RouterOutputs, trpc } from "@/utils/trpc";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Trophy,
  Calendar,
  Target,
  Coins,
  Tv,
  History,
  TrendingUp,
  User as UserIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Loader2
} from "lucide-react";
import { cn } from "../../lib/utils";
import RatingIcon from "../Review/RatingIcon";

type SeasonDetailsProps = {
  season: RouterOutputs["season"]["getById"];
};

export const SeasonDetails = ({ season }: SeasonDetailsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("points");

  // Fetch user summary for leaderboard
  const { data: userSummary = [], isLoading: userSummaryLoading } = trpc.season.getUserSummary.useQuery(
    { seasonId: season?.id ?? "" },
    { enabled: !!season?.id }
  );

  // Fetch chart data
  const { data: chartDataRaw = [], isLoading: chartLoading } = trpc.season.getChartData.useQuery(
    { seasonId: season?.id ?? "" },
    { enabled: !!season?.id }
  );

  // Paginated points query with infinite loading
  const {
    data: pointsData,
    fetchNextPage: fetchNextPoints,
    hasNextPage: hasNextPoints,
    isFetchingNextPage: isFetchingNextPoints,
    isLoading: pointsLoading,
  } = trpc.season.getPoints.useInfiniteQuery(
    { seasonId: season?.id ?? "", limit: 50 },
    {
      enabled: !!season?.id && activeTab === "points",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Paginated guesses query with infinite loading
  const {
    data: guessesData,
    fetchNextPage: fetchNextGuesses,
    hasNextPage: hasNextGuesses,
    isFetchingNextPage: isFetchingNextGuesses,
    isLoading: guessesLoading,
  } = trpc.season.getGuesses.useInfiniteQuery(
    { seasonId: season?.id ?? "", limit: 50 },
    {
      enabled: !!season?.id && activeTab === "guesses",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Paginated gambling query with infinite loading
  const {
    data: gamblingData,
    fetchNextPage: fetchNextGambling,
    hasNextPage: hasNextGambling,
    isFetchingNextPage: isFetchingNextGambling,
    isLoading: gamblingLoading,
  } = trpc.season.getGambling.useInfiniteQuery(
    { seasonId: season?.id ?? "", limit: 50 },
    {
      enabled: !!season?.id && activeTab === "gambling",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Process points into grouped structure
  const { groupedPoints, otherPoints } = useMemo(() => {
    if (!pointsData?.pages) return { groupedPoints: [], otherPoints: [] };

    const allPoints = pointsData.pages.flatMap(page => page.items);

    const episodesMap = new Map<
      string,
      {
        episode: any;
        assignmentsMap: Map<string, { assignment: any; points: any[] }>;
      }
    >();
    const others: any[] = [];

    allPoints.forEach((point) => {
      let episode = null;
      let assignment = null;

      const guess = point.guesses?.[0];
      const assignmentPoint = point.assignmentPoints?.[0];

      if (guess) {
        assignment = guess.assignmentReview?.assignment;
        episode = assignment?.episode;
      } else if (assignmentPoint) {
        assignment = assignmentPoint.assignment;
        episode = assignment?.episode;
      }

      if (episode && assignment) {
        if (!episodesMap.has(episode.id)) {
          episodesMap.set(episode.id, {
            episode,
            assignmentsMap: new Map(),
          });
        }
        const episodeGroup = episodesMap.get(episode.id)!;

        if (!episodeGroup.assignmentsMap.has(assignment.id)) {
          episodeGroup.assignmentsMap.set(assignment.id, {
            assignment,
            points: [],
          });
        }
        episodeGroup.assignmentsMap.get(assignment.id)!.points.push(point);
      } else {
        others.push(point);
      }
    });

    const sortedEpisodes = Array.from(episodesMap.values())
      .sort((a, b) => a.episode.number - b.episode.number)
      .map((ep) => ({
        ...ep,
        assignments: Array.from(ep.assignmentsMap.values()),
      }));

    return {
      groupedPoints: sortedEpisodes,
      otherPoints: others,
    };
  }, [pointsData]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!chartDataRaw || chartDataRaw.length === 0) return [];

    const pointsByDate = [...chartDataRaw].sort(
      (a, b) => new Date(a.earnedOn).getTime() - new Date(b.earnedOn).getTime()
    );

    const chartDataPointMap = new Map<string, Record<string, any>>();
    const runningTotals: Record<string, number> = {};

    // Initialize running totals for all users
    userSummary.forEach(u => {
      runningTotals[u.user.id] = 0;
    });

    pointsByDate.forEach((point) => {
      const dateKey = format(new Date(point.earnedOn), "MMM dd");
      const points = (point.adjustment ?? 0) + (point.gamePointType?.points ?? 0);

      runningTotals[point.userId] = (runningTotals[point.userId] || 0) + points;

      chartDataPointMap.set(dateKey, {
        date: dateKey,
        ...runningTotals
      });
    });

    return Array.from(chartDataPointMap.values());
  }, [chartDataRaw, userSummary]);

  // Get all guesses from paged data
  const allGuesses = useMemo(() => {
    return guessesData?.pages.flatMap(page => page.items) ?? [];
  }, [guessesData]);

  // Get all gambling points from paged data
  const allGambling = useMemo(() => {
    return gamblingData?.pages.flatMap(page => page.items) ?? [];
  }, [gamblingData]);

  const totalStats = {
    points: season?._count?.points ?? 0,
    guesses: season?._count?.guesses ?? 0,
    gambling: season?._count?.gamblingPoints ?? 0,
  };

  const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.map(n => n[0]).join("").toUpperCase().substring(0, 2) || "U";
  }

  if (!season) return null;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* season Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-primary/20 bg-primary/5 text-primary">
              Season Details
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold">
              {season.gameTypeId === 1 ? "Standard" : "Advanced"}
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">{season.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            {season.description}
          </p>
          <div className="mt-4">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Season
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Season Details</DialogTitle>
                </DialogHeader>
                <EditSeasonForm
                  season={season}
                  onSuccess={() => setIsEditDialogOpen(false)}
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</span>
            <span className="text-sm font-bold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {season.startedOn ? format(new Date(season.startedOn), "MMM d, yyyy") : "TBD"}
            </span>
          </div>
          {season.endedOn && (
            <>
              <div className="h-8 w-px bg-muted-foreground/20" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ended On</span>
                <span className="text-sm font-bold flex items-center gap-1.5 opacity-80">
                  <History className="h-4 w-4 text-orange-500" />
                  {format(new Date(season.endedOn), "MMM d, yyyy")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative group">
          <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{totalStats.points}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Point allocations recorded</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/10 shadow-sm overflow-hidden relative group">
          <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Target className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-orange-600/70 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Guesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-orange-600">{totalStats.guesses}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Community predictions</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm overflow-hidden relative group">
          <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Coins className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-600/70 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Gambling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600">{totalStats.gambling}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Points wagered on outcomes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Leaderboard & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Points accumulation Area Chart */}
          {chartLoading ? (
            <Card className="border-none shadow-md overflow-hidden bg-card">
              <CardContent className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : chartData.length > 0 && (
            <Card className="border-none shadow-md overflow-hidden bg-card">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performance Tracking
                    </CardTitle>
                    <CardDescription>Cumulative point progression throughout the season.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        {userSummary.map((u, index) => (
                          <linearGradient key={`grad-${u.user.id}`} id={`color-${u.user.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                            <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800 }}
                      />
                      {userSummary.map((u, index) => (
                        <Area
                          key={u.user.id}
                          type="monotone"
                          dataKey={u.user.id}
                          name={u.user.name ?? "User"}
                          stroke={COLORS[index % COLORS.length]}
                          fillOpacity={1}
                          fill={`url(#color-${u.user.id})`}
                          strokeWidth={3}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md h-12 bg-muted/50 p-1 mb-6">
              <TabsTrigger value="points" className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2">
                <History className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="guesses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2">
                <Target className="h-4 w-4" />
                Guesses
              </TabsTrigger>
              <TabsTrigger value="gambling" className="data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2">
                <Coins className="h-4 w-4" />
                Gambling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {pointsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : groupedPoints.length > 0 ? (
                <>
                  {groupedPoints.map((group) => (
                    <div key={group.episode.id} className="relative pl-6 border-l-2 border-muted hover:border-primary/30 transition-colors py-4 group/episode">
                      <div className="absolute left-[-9px] top-6 w-4 h-4 rounded-full bg-background border-2 border-muted group-hover/episode:border-primary/50 transition-colors" />

                      <div className="flex items-center gap-3 mb-6">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          Ep {group.episode.number}
                        </span>
                        <h3 className="text-xl font-black text-foreground">{group.episode.title}</h3>
                      </div>

                      <div className="grid gap-6">
                        {group.assignments.map((assignGroup) => (
                          <div key={assignGroup.assignment.id} className="bg-card rounded-xl border p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <Tv className="h-4 w-4 text-primary opacity-50" />
                              <h4 className="font-bold text-foreground truncate">
                                {assignGroup.assignment.movie?.title || assignGroup.assignment.episode?.title}
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {assignGroup.points.map((point) => (
                                <div key={point.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-transparent hover:border-muted-foreground/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border bg-background">
                                      <AvatarImage src={point.user.image || ""} />
                                      <AvatarFallback className="text-[10px] font-black">{getInitials(point.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold">{point.user.name}</span>
                                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                        {point.gamePointType?.title || point.reason}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge className={cn(
                                    "font-mono font-black border-none",
                                    (point.adjustment ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                  )}>
                                    {(point.adjustment ?? 0) > 0 ? "+" : ""}{point.adjustment ?? 0}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Load More Button for Points */}
                  {hasNextPoints && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPoints()}
                        disabled={isFetchingNextPoints}
                        className="gap-2"
                      >
                        {isFetchingNextPoints && <Loader2 className="h-4 w-4 animate-spin" />}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                  <History className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground font-medium">No activity recorded for this season timeline.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="guesses" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {guessesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allGuesses.length > 0 ? (
                    <>
                      {allGuesses.map((guess) => (
                        <Card key={guess.id} className="border-none shadow-sm bg-card hover:translate-y-[-2px] transition-transform">
                          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={guess.user.image || ""} />
                                <AvatarFallback className="text-xs font-bold">{getInitials(guess.user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-tight">{guess.user.name}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                  {format(new Date(guess.created), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                            <RatingIcon value={guess.rating.value} />
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-xs font-semibold text-muted-foreground mt-2">
                              <Tv className="h-3 w-3" />
                              <span className="truncate">
                                {guess.assignmentReview.assignment.movie?.title || guess.assignmentReview.assignment.episode?.title}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                      <Target className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                      <p className="text-muted-foreground font-medium">No guesses have been submitted yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Load More Button for Guesses */}
              {hasNextGuesses && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextGuesses()}
                    disabled={isFetchingNextGuesses}
                    className="gap-2"
                  >
                    {isFetchingNextGuesses && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gambling" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {gamblingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allGambling.length > 0 ? (
                    <>
                      {allGambling.map((gamble) => (
                        <Card key={gamble.id} className="border-none shadow-sm bg-card overflow-hidden">
                          <div className={cn(
                            "h-1 w-full",
                            gamble.status === "won" ? "bg-emerald-500" : (gamble.status === "lost" ? "bg-rose-500" : "bg-muted")
                          )} />
                          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={gamble.user.image || ""} />
                                <AvatarFallback className="text-xs font-bold">{getInitials(gamble.user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-tight">{gamble.user.name}</span>
                                <Badge className={cn(
                                  "w-fit px-1.5 py-0 text-[8px] font-black uppercase mt-1",
                                  gamble.status === "won" ? "bg-emerald-100 text-emerald-700" : (gamble.status === "lost" ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground")
                                )}>
                                  {gamble.status === "won" ? "Successful" : (gamble.status === "lost" ? "Lost" : "Pending/Locked")}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="block text-xl font-black text-foreground">{gamble.points}</span>
                              <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50 tracking-tighter">Points</span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs font-semibold text-muted-foreground mt-2 group-hover:bg-muted/50 transition-colors">
                              <Coins className="h-3 w-3 text-emerald-500 opacity-50" />
                              <span className="truncate">Wager on: {gamble.gamblingType?.title}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                      <Coins className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                      <p className="text-muted-foreground font-medium">The gambling pits are currently quiet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Load More Button for Gambling */}
              {hasNextGambling && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextGambling()}
                    disabled={isFetchingNextGambling}
                    className="gap-2"
                  >
                    {isFetchingNextGambling && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Leaderboard Recap */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            Leaderboard
          </h2>

          {userSummaryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3">
              {userSummary.map(({ user, total, guessCount, gamblingCount }, index) => {
                const rankColor = index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-muted-foreground";

                return (
                  <Link
                    href={`/user/${user.id}`}
                    key={user.id}
                    className="group relative block rounded-2xl border bg-card p-4 transition-all hover:shadow-xl hover:translate-y-[-2px] hover:border-primary/20 overflow-hidden"
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="h-20 w-20" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-black text-sm",
                        index < 3 ? "bg-muted/50" : "bg-transparent"
                      )}>
                        <span className={rankColor}>#{index + 1}</span>
                      </div>

                      <Avatar className={cn(
                        "h-12 w-12 border-2 shadow-md transition-transform group-hover:scale-110",
                        index === 0 ? "border-yellow-500/50" : "border-border"
                      )}>
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black truncate text-foreground text-sm group-hover:text-primary transition-colors">
                            {user.name}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-primary leading-none">{total}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Points</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                            <Target className="h-2.5 w-2.5" />
                            {guessCount}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                            <Coins className="h-2.5 w-2.5" />
                            {gamblingCount}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Other points (Miscellaneous) if any */}
          {otherPoints.length > 0 && (
            <Card className="mt-8 border-none bg-muted/30 border-2 border-dashed border-muted-foreground/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Miscellaneous Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {otherPoints.map((point) => (
                  <div key={point.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 text-[11px] font-bold border border-transparent hover:border-muted-foreground/10 transition-colors">
                    <span className="text-muted-foreground truncate max-w-[120px]">{point.user.name}</span>
                    <span className="mx-2 text-[9px] text-muted-foreground/50 truncate flex-1 font-medium">{point.gamePointType?.title || point.reason}</span>
                    <Badge variant="secondary" className={cn(
                      "px-1.5 py-0 font-mono text-[9px]",
                      (point.adjustment ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {(point.adjustment ?? 0) > 0 ? "+" : ""}{point.adjustment ?? 0}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
