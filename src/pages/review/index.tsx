import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { Trash2, Star, User, Film, Tv, Loader2, Filter } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import Image from "next/image";
import { useState } from "react";
import RatingIcon from "../../components/Review/RatingIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import Link from "next/link";

export async function getServerSideProps(context: GetServerSidePropsContext) {
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

interface Movie {
  id: string;
  title: string;
  poster: string | null;
  year: number;
}

interface Show {
  id: string;
  title: string;
  poster: string | null;
  year: number;
}

interface Episode {
  id: string;
  number: number;
  title: string;
}

interface Assignment {
  id: string;
  type: string;
  episode: Episode;
}

interface Review {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  movie: Movie | null;
  show: Show | null;
  ratingId: string | null;
  rating: {
    id: string;
    name: string;
    value: number;
  } | null;
  assignmentReviews: {
    id: string;
    assignment: Assignment;
  }[];
  extraReviews: {
    id: string;
    episode: Episode;
  }[];
}

const ReviewsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const router = useRouter();
  const ratingFilter = (router.query.rating as string) || "all";
  const userFilter = (router.query.user as string) || "all";

  const setRatingFilter = (value: string) => {
    const query = { ...router.query };
    if (value === "all") delete query.rating;
    else query.rating = value;
    router.push({ query }, undefined, { shallow: true });
  };

  const setUserFilter = (value: string) => {
    const query = { ...router.query };
    if (value === "all") delete query.user;
    else query.user = value;
    router.push({ query }, undefined, { shallow: true });
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = trpc.review.getAll.useInfiniteQuery(
    {
      limit: 50,
      ratingId: ratingFilter === "all" ? undefined : (ratingFilter === "none" ? null : ratingFilter),
      userId: userFilter === "all" ? undefined : userFilter
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const { data: ratings } = trpc.review.getRatings.useQuery();
  const { data: users } = trpc.user.getAll.useQuery();

  const setRatingMutation = trpc.review.setReviewRating.useMutation({
    onSuccess: () => refetch(),
  });

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">All Reviews</h2>
            <p className="text-muted-foreground">Manage and audit all submitted reviews. ({reviews.length} shown)</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="none">No Rating</SelectItem>
                {ratings?.map((rating) => (
                  <SelectItem key={rating.id} value={rating.id}>
                    {rating.name} ({rating.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

              {reviews.map((review: Review) => (
                <TableRow key={review.id} className="group">
                  <TableCell>
                    <Link href={`/users/${review.user?.id}`}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{review.user?.name || review.user?.email}</span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {review.movie ? (
                        <Link href={`/movie/${review.movie.id}`} className="flex items-center gap-3">
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
                        </Link>
                      ) : review.show ? (
                        <Link href={`/show/${review.show.id}`} className="flex items-center gap-3">
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
                        </Link>
                      ) : "Unknown Content"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={review.ratingId || "none"}
                      onValueChange={(value) => setRatingMutation.mutate({ reviewId: review.id, ratingId: value === "none" ? null : value })}
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 transition-colors px-2 w-[140px] focus:ring-0">
                        <SelectValue>
                          {review.rating ? (
                            <div className="flex items-center gap-1">
                              <RatingIcon value={review.rating.value} />
                              <span className="text-xs font-semibold">{review.rating.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Rating</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Rating</SelectItem>
                        {ratings?.map((rating) => (
                          <SelectItem key={rating.id} value={rating.id}>
                            <div className="flex items-center gap-2">
                              <RatingIcon value={rating.value} />
                              <span>{rating.name} ({rating.value})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {review.assignmentReviews?.map((ar) => (
                        <span key={ar.id} className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 w-fit">
                          Ep {ar.assignment.episode.number} {ar.assignment.type}
                        </span>
                      ))}
                      {review.extraReviews?.map((er) => (
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
