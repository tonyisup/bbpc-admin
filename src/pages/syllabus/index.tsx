import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { Trash2, BookOpen, User, Film, Loader2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import Image from "next/image";
import { Fragment } from "react";

export async function getServerSideProps(context: any) {
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

const SyllabusPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const removeMutation = trpc.syllabus.remove.useMutation();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage
  } = trpc.syllabus.getAll.useInfiniteQuery(
    { limit: 50 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const syllabusItems = data?.pages.flatMap((page) => page.items) ?? [];

  const handleRemove = (id: string) => {
    removeMutation.mutate({ id });
  };

  return (
    <>
      <Head>
        <title>Global Syllabus - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Syllabus</h2>
          <p className="text-muted-foreground">Manage all user movie syllabuses. ({syllabusItems.length} shown)</p>
        </div>

        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Movie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              )}

              {!isLoading && syllabusItems.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No syllabus items found.</TableCell></TableRow>
              )}

              {syllabusItems.map((item: any) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.user.name || item.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.movie.poster && (
                        <div className="w-8 h-12 relative rounded overflow-hidden shadow-sm flex-shrink-0">
                          <Image
                            unoptimized
                            src={item.movie.poster}
                            alt={item.movie.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold line-clamp-1">{item.movie.title}</span>
                        <span className="text-xs text-muted-foreground">{item.movie.year}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.assignment ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 w-fit">
                          Assigned
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ep {item.assignment.episode.number}: {item.assignment.episode.title}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default SyllabusPage;
