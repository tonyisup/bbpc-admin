import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { SeasonDetails } from "@/components/seasons/SeasonDetails";
import { trpc } from "@/utils/trpc";
import { ChevronLeft, Home, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const SeasonDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: season, isLoading } = trpc.season.getById.useQuery({
    id: id as string,
  }, {
    enabled: !!id,
  });

  return (
    <>
      <Head>
        <title>{season ? `${season.title} - BBPC Admin` : 'Loading Season...'}</title>
      </Head>

      <main className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-10 pb-4 border-b border-dashed">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              Admin
            </Link>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
            <Link href="/season" className="hover:text-primary transition-colors flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Seasons
            </Link>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
            <span className="text-foreground truncate max-w-[200px]">{season?.title || 'Details'}</span>
          </nav>

          {isLoading ? (
            <div className="space-y-8 animate-pulse">
              <div className="h-12 w-64 bg-muted rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-muted rounded-2xl" />
                <div className="h-32 bg-muted rounded-2xl" />
                <div className="h-32 bg-muted rounded-2xl" />
              </div>
            </div>
          ) : season ? (
            <SeasonDetails season={season} />
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4">
              <Layers className="h-12 w-12 text-muted-foreground opacity-20" />
              <h2 className="text-xl font-bold">Season Not Found</h2>
              <p className="text-muted-foreground">The season you are looking for does not exist or has been removed.</p>
              <Link href="/season">
                <Button variant="outline">Back to Seasons</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default SeasonDetailPage;
