import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import { type DispatchWithoutAction } from "react";
import { Trash2, Eye, Loader2 } from "lucide-react";
import AddEpisodeModal from "../../components/Episode/AddEpisodeModal";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";

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

const EpisodesPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = trpc.episode.getAll.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const episodes = data?.pages.flatMap((page) => page.items) ?? [];
  const refresh = () => refetch();

  const { mutate: removeEpisode } = trpc.episode.remove.useMutation({
    onSuccess: () => {
      refresh();
    }
  });

  return (
    <>
      <Head>
        <title>Episodes - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Episodes</h2>
            <p className="text-muted-foreground">Manage your podcast episodes here.</p>
          </div>
          <AddEpisodeModal refreshItems={refresh} />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>}

              {!isLoading && episodes?.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No episodes found.</TableCell></TableRow>
              )}

              {episodes?.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="font-medium">{episode.number}</TableCell>
                  <TableCell>
                    <Link href={`/episode/${encodeURIComponent(episode.id)}`} className="hover:underline">
                      {episode.title}
                    </Link>
                  </TableCell>
                  <TableCell>{episode.date ? new Date(episode.date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/episode/plain/${encodeURIComponent(episode.id)}`}>
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeEpisode({ id: episode.id })} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full max-w-xs"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default EpisodesPage;
