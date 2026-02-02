import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Trophy, Target, Coins, Star, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/utils/trpc";

interface EpisodePointsSummaryProps {
    episode: NonNullable<RouterOutputs['episode']['getRecordingData']>;
    bonusPointsData?: Record<string, number>;
}

export const EpisodePointsSummary = ({ episode, bonusPointsData }: EpisodePointsSummaryProps) => {
    // Aggregate points per user
    const userStats = new Map<string, {
        id: string;
        name: string;
        image: string | null;
        guessPoints: number;
        gamblingPoints: number;
        bonusPoints: number;
        total: number;
    }>();

    const getOrCreateUser = (user: { id: string; name: string | null; image: string | null }) => {
        if (!userStats.has(user.id)) {
            userStats.set(user.id, {
                id: user.id,
                name: user.name || "Unknown",
                image: user.image,
                guessPoints: 0,
                gamblingPoints: 0,
                bonusPoints: 0,
                total: 0,
            });
        }
        return userStats.get(user.id)!;
    };

    // 1. Process Guesses and Gambling from recordingData
    episode.assignments?.forEach(assignment => {
        // Guesses
        assignment.assignmentReviews?.forEach(ar => {
            ar.guesses?.forEach(guess => {
                if (guess.point && guess.user) {
                    const stats = getOrCreateUser(guess.user);
                    const points = (guess.point.adjustment ?? 0) + (guess.point.gamePointType?.points ?? 0);
                    stats.guessPoints += points;
                    stats.total += points;
                }
            });
        });

        // Gambling
        assignment.gamblingPoints?.forEach(gp => {
            if (gp.point && gp.user) {
                const stats = getOrCreateUser(gp.user);
                const points = (gp.point.adjustment ?? 0) + (gp.point.gamePointType?.points ?? 0);
                stats.gamblingPoints += points;
                stats.total += points;
            }
        });
    });

    // 2. Process Bonus Points (Manual adjustments/AssignmentPoints)
    if (bonusPointsData) {
        Object.entries(bonusPointsData).forEach(([key, value]) => {
            const [userId, assignmentId] = key.split("::");
            if (!userId || !assignmentId || value === 0) return;

            // Find user info from either assignments or look it up if we had a full list
            // Since we only have users who participated in this episode in recordingData, 
            // we'll try to find them there first.
            let userData = null;
            episode.assignments?.forEach(a => {
                if (a.user.id === userId) userData = a.user;
                a.assignmentReviews?.forEach(ar => {
                    if (ar.review.user?.id === userId) userData = ar.review.user;
                    ar.guesses?.forEach(g => {
                        if (g.user?.id === userId) userData = g.user;
                    });
                });
                a.gamblingPoints?.forEach(gp => {
                    if (gp.user.id === userId) userData = gp.user;
                    if (gp.targetUser?.id === userId) userData = gp.targetUser;
                });
            });

            if (userId && userData) {
                const stats = getOrCreateUser(userData);
                stats.bonusPoints += value;
                stats.total += value;
            }
        });
    }

    const sortedUsers = Array.from(userStats.values())
        .filter(u => u.total !== 0 || u.guessPoints !== 0 || u.gamblingPoints !== 0 || u.bonusPoints !== 0)
        .sort((a, b) => b.total - a.total);

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    if (sortedUsers.length === 0) return null;

    return (
        <Card className="w-full max-w-6xl border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Sigma className="h-6 w-6 text-amber-500" />
                            Episode Results Summary
                        </CardTitle>
                        <CardDescription className="font-medium text-amber-500/60">
                            Breakdown of points earned during this episode
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedUsers.map((user, index) => (
                        <div key={user.id} className="bg-card/50 rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-12 w-12 border-2 border-amber-500/30">
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback className="bg-amber-500/10 text-amber-500 font-bold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-foreground truncate">{user.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn(
                                            "font-mono font-black text-xs",
                                            user.total > 0 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                                user.total < 0 ? "text-rose-500 border-rose-500/20 bg-rose-500/5" : ""
                                        )}>
                                            {user.total > 0 ? "+" : ""}{user.total} PTS TOTAL
                                        </Badge>
                                    </div>
                                </div>
                                {index === 0 && user.total > 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight text-muted-foreground/60">
                                    <div className="flex items-center gap-1.5">
                                        <Target className="h-3 w-3" />
                                        Guesses
                                    </div>
                                    <span className={cn(user.guessPoints > 0 ? "text-emerald-500" : "")}>
                                        {user.guessPoints > 0 ? "+" : ""}{user.guessPoints}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight text-muted-foreground/60">
                                    <div className="flex items-center gap-1.5">
                                        <Coins className="h-3 w-3" />
                                        Gambling
                                    </div>
                                    <span className={cn(user.gamblingPoints > 0 ? "text-emerald-500" : user.gamblingPoints < 0 ? "text-rose-500" : "")}>
                                        {user.gamblingPoints > 0 ? "+" : ""}{user.gamblingPoints}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight text-muted-foreground/60">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-3 w-3" />
                                        Bonuses / Manual
                                    </div>
                                    <span className={cn(user.bonusPoints > 0 ? "text-emerald-500" : user.bonusPoints < 0 ? "text-rose-500" : "")}>
                                        {user.bonusPoints > 0 ? "+" : ""}{user.bonusPoints}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar visual */}
                            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                                {user.total > 0 && (
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${Math.min(100, (user.total / 50) * 100)}%` }} // Arbitrary cap for visual
                                    />
                                )}
                                {user.total < 0 && (
                                    <div
                                        className="h-full bg-rose-500 ml-auto"
                                        style={{ width: `${Math.min(100, (Math.abs(user.total) / 50) * 100)}%` }}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
