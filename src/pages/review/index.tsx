import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { Trash2, Star, User, Film, Tv, Loader2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import Image from "next/image";
import { Fragment } from "react";
import RatingIcon from "../../components/Review/RatingIcon";

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

const ReviewsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = trpc.review.getAll.useInfiniteQuery(
    { limit: 50 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const removeMutation = trpc.review.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      removeMutation.mutate({ id });
    }
  };

  const reviews = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <Head>
        <title>All Reviews - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Reviews</h2>
          <p className="text-muted-foreground">Manage and audit all submitted reviews. ({reviews.length} shown)</p>
        </div>

        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              )}

              {!isLoading && reviews.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No reviews found.</TableCell></TableRow>
              )}

              {reviews.map((review: any) => (
                <TableRow key={review.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{review.user?.name || review.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {review.movie ? (
                        <>
                          {review.movie.poster && (
                            <div className="w-8 h-12 relative rounded overflow-hidden shadow-sm flex-shrink-0">
                              <Image unoptimized src={review.movie.poster} alt={review.movie.title} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-sm line-clamp-1 flex items-center gap-1">
                              <Film className="h-3 w-3 text-sky-500" /> {review.movie.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{review.movie.year}</span>
                          </div>
                        </>
                      ) : review.show ? (
                        <>
                          {review.show.poster && (
                            <div className="w-8 h-12 relative rounded overflow-hidden shadow-sm flex-shrink-0">
                              <Image unoptimized src={review.show.poster} alt={review.show.title} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-sm line-clamp-1 flex items-center gap-1">
                              <Tv className="h-3 w-3 text-purple-500" /> {review.show.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{review.show.year}</span>
                          </div>
                        </>
                      ) : "Unknown Content"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.rating ? (
                      <div className="flex items-center gap-1">
                        <RatingIcon value={review.rating.value} />
                        <span className="text-xs text-muted-foreground">({review.rating.name})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No Rating</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {review.assignmentReviews?.map((ar: any) => (
                        <span key={ar.id} className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 w-fit">
                          Ep {ar.assignment.episode.number} Assignment
                        </span>
                      ))}
                      {review.extraReviews?.map((er: any) => (
                        <span key={er.id} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 w-fit">
                          Ep {er.episode.number} Extra
                        </span>
                      ))}
                      {(!review.assignmentReviews?.length && !review.extraReviews?.length) && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded w-fit italic">
                          Standalone
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemove(review.id)}>
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

export default ReviewsPage;
