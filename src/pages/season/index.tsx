import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { NewSeasonForm } from "@/components/seasons/NewSeasonForm";
import { SeasonsList } from "@/components/seasons/SeasonsList";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { Plus, Trophy, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

const SeasonPage: NextPage = () => {
  const { data: session } = useSession();
  const { data: seasons, isLoading, refetch } = trpc.season.getAll.useQuery();
  const { data: user } = trpc.user.get.useQuery({ id: session?.user?.id });
  const isAdmin = user?.roles.some((ur) => ur.role.admin) || false;

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSeasons = seasons?.filter(season =>
    season.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    season.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Seasons - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-8 py-8 px-4 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-8 rounded-2xl border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Trophy className="h-32 w-32 -rotate-12" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Seasons
            </h1>
            <p className="text-muted-foreground text-lg mt-2 font-medium">
              Manage game seasons, rules, and point systems.
            </p>
          </div>

          {isAdmin && (
            <div className="relative z-10">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg hover:shadow-primary/20 transition-all gap-2 px-8">
                    <Plus className="h-5 w-5" />
                    New Season
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Create New Season</DialogTitle>
                    <DialogDescription>
                      Configure a new competitive season with its own game type and duration.
                    </DialogDescription>
                  </DialogHeader>
                  <NewSeasonForm onSuccess={() => {
                    refetch();
                    setIsModalOpen(false);
                  }} onCancel={() => setIsModalOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-xl border border-dashed">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by season name or description..."
              className="pl-11 h-12 bg-card border-none shadow-none focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-l h-8">
            <Calendar className="h-3.5 w-3.5" />
            {filteredSeasons?.length || 0} Seasons
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[200px] rounded-2xl bg-muted animate-pulse border-2 border-dashed border-muted-foreground/10" />
              ))}
            </div>
          ) : filteredSeasons?.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No seasons found</h3>
                <p className="text-muted-foreground">Try adjusting your search or create a new season.</p>
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
              )}
            </div>
          ) : (
            <SeasonsList seasons={filteredSeasons} />
          )}
        </div>
      </div>
    </>
  );
};

export default SeasonPage;
