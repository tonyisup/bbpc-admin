import Link from "next/link";
import { type RouterOutputs, trpc } from "@/utils/trpc";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
    Trophy,
    Target,
    Coins,
    ChevronRight,
    Loader2,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SeasonLeaderboardProps {
    seasonId: string;
}

export const SeasonLeaderboard = ({ seasonId }: SeasonLeaderboardProps) => {
    const { data: userSummary = [], isLoading: userSummaryLoading, refetch, isRefetching } = trpc.season.getUserSummary.useQuery(
        { seasonId },
        { enabled: !!seasonId }
    );

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return parts.map(n => n[0]).join("").toUpperCase().substring(0, 2) || "U";
    }

    if (userSummaryLoading) {
        return (
            <Card className="w-full max-w-6xl">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-6xl overflow-hidden border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-primary" />
                            Current Season Leaderboard
                        </CardTitle>
                        <CardDescription className="font-medium text-primary/60">
                            Real-time standings for the current season
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userSummary.map(({ user, total, guessCount, gamblingCount }, index) => {
                        const rankColor = index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-muted-foreground";

                        return (
                            <Link
                                href={`/user/${user.id}`}
                                key={user.id}
                                className="group relative block rounded-2xl border bg-card/50 p-4 transition-all hover:shadow-xl hover:translate-y-[-2px] hover:border-primary/20 overflow-hidden"
                            >
                                {index === 0 && (
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Trophy className="h-16 w-16" />
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
            </CardContent>
        </Card>
    );
};
