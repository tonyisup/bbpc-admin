import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, ChevronRight, Gamepad2, Users, Receipt, Flag, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

import { type RouterOutputs } from "@/utils/trpc";

type SeasonWithDetails = RouterOutputs["season"]["getAll"][number];


type SeasonsListProps = {
  seasons?: SeasonWithDetails[];
};

export const SeasonsList = ({ seasons }: SeasonsListProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "Ongoing";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {seasons?.map((season) => {
        const now = new Date();
        const startDate = season.startedOn ? new Date(season.startedOn) : null;
        const isFuture = !!startDate && !isNaN(startDate.getTime()) && startDate > now;
        const isEnded = !!season.endedOn && new Date(season.endedOn) < now;
        const isActive = !isFuture && (!season.endedOn || new Date(season.endedOn) >= now);

        return (
          <Link key={season.id} href={`/season/${season.id}`} className="group block focus:outline-none">
            <Card className={cn(
              "h-full border-none shadow-sm group-hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col",
              isActive ? "ring-1 ring-primary/20" : isFuture ? "ring-1 ring-blue-500/20 shadow-blue-500/5" : "opacity-80 grayscale-[0.2]"
            )}>
              {/* Status Indicator */}
              <div className={cn(
                "absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-widest z-10",
                isActive ? "bg-primary text-primary-foreground shadow-lg" : isFuture ? "bg-blue-600 text-white shadow-lg" : "bg-muted text-muted-foreground"
              )}>
                {isActive ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Active
                  </span>
                ) : isFuture ? (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Upcoming
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3 w-3" />
                    Ended
                  </span>
                )}
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="px-2 py-0 border-none bg-muted/50 text-[10px] h-5 flex items-center gap-1">
                    <Gamepad2 className="h-3 w-3 opacity-70" />
                    {season.gameType?.title || "Game"}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                  {season.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10 leading-relaxed font-medium">
                  {season.description || "No description provided for this season."}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="font-semibold">{formatDate(season.startedOn)}</span>
                    <ChevronRight className="h-3 w-3 opacity-40 mx-auto" />
                    <span className={cn(
                      "font-semibold",
                      !season.endedOn && "text-primary"
                    )}>
                      {formatDate(season.endedOn)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/5 group/stat hover:bg-primary/10 transition-colors">
                    <span className="text-[10px] font-bold uppercase text-primary/70 tracking-widest block mb-1">Guesses</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary/40 group-hover/stat:text-primary transition-colors" />
                      <span className="text-xl font-black text-primary">{season._count?.guesses ?? 0}</span>
                    </div>
                  </div>
                  <div className="bg-orange-500/5 rounded-xl p-3 border border-orange-500/5 group/points hover:bg-orange-500/10 transition-colors">
                    <span className="text-[10px] font-bold uppercase text-orange-600/70 tracking-widest block mb-1">Points</span>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-orange-500/40 group-hover/points:text-orange-600 transition-colors" />
                      <span className="text-xl font-black text-orange-600">{season._count?.points ?? 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                  View Full Details
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
