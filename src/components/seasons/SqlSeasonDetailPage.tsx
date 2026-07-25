import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronLeft, Home, Layers } from "lucide-react";

import { trpc } from "@/utils/trpc";

import { SeasonDetails } from "./SeasonDetails";
import { Button } from "../ui/button";

const SqlSeasonDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: season, isLoading } = trpc.season.getById.useQuery(
    {
      id: id as string,
    },
    {
      enabled: !!id,
    }
  );

  return (
    <>
      <Head>
        <title>
          {season ? `${season.title} - BBPC Admin` : "Loading Season..."}
        </title>
      </Head>

      <main className="min-h-screen pb-20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-10 flex items-center gap-2 border-b border-dashed pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Link
              className="flex items-center gap-1 transition-colors hover:text-primary"
              href="/"
            >
              <Home className="h-3 w-3" />
              Admin
            </Link>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
            <Link
              className="flex items-center gap-1 transition-colors hover:text-primary"
              href="/season"
            >
              <Layers className="h-3 w-3" />
              Seasons
            </Link>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-30" />
            <span className="max-w-[200px] truncate text-foreground">
              {season?.title || "Details"}
            </span>
          </nav>

          {isLoading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-12 w-64 rounded-lg bg-muted" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
              </div>
            </div>
          ) : season ? (
            <SeasonDetails season={season} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-20 text-center">
              <Layers className="h-12 w-12 text-muted-foreground opacity-20" />
              <h2 className="text-xl font-bold">Season Not Found</h2>
              <p className="text-muted-foreground">
                The season you are looking for does not exist or has been
                removed.
              </p>
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

export default SqlSeasonDetailPage;
