import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft, Calendar, Film, Star, ExternalLink, User, Mic2 } from "lucide-react";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import Image from "next/image";
import RatingIcon from "@/components/Review/RatingIcon";

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

const ShowDetailPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { query } = useRouter();
  const id = query.id as string;

  const { data: show, isLoading } = trpc.show.get.useQuery(
    { id },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-bold">Show not found</h2>
        <Button asChild variant="outline">
          <Link href="/show">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Shows
          </Link>
        </Button>
      </div>
    );
  }

  // Deduplicate episodes from extraReviews and assignmentReviews
  const linkedEpisodesMap = new Map();
  show.reviews.forEach(review => {
    review.extraReviews.forEach(er => {
      if (er.episode) linkedEpisodesMap.set(er.episode.id, er.episode);
    });
    review.assignmentReviews.forEach(ar => {
      if (ar.assignment?.episode) linkedEpisodesMap.set(ar.assignment.episode.id, ar.assignment.episode);
    });
  });
  const linkedEpisodes = Array.from(linkedEpisodesMap.values()).sort((a, b) => b.number - a.number);

  return (
    <>
      <Head>
        <title>{`${show.title} - Show Details | BBPC Admin`}</title>
      </Head>

      <div className="flex flex-col gap-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/show">
              <ChevronLeft className="h-4 w-4" />
              Back to Shows
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-lg">
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
            <Film className="h-48 w-48" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            {/* Poster */}
            <div className="w-full md:w-48 aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl border bg-muted">
              {show.poster ? (
                <Image
                  unoptimized
                  src={show.poster}
                  alt={show.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-2 py-0 h-6 font-bold text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                  TV Show
                </Badge>
                <Badge variant="secondary" className="px-2 py-0 h-6 font-bold text-[10px] uppercase tracking-wider">
                  {show.year}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{show.title}</h1>

              <div className="flex items-center gap-6">
                <a
                  href={show.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on IMDb
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Linked Episodes */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-primary" />
                  Linked Episodes
                </CardTitle>
                <CardDescription>Episodes where this show was reviewed.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {linkedEpisodes.length > 0 ? (
                    linkedEpisodes.map(episode => (
                      <Link
                        key={episode.id}
                        href={`/episode/${episode.id}`}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">
                            Ep. {episode.number}: {episode.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {episode.date ? new Date(episode.date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                        <ChevronLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No episodes linked yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Reviews
                </CardTitle>
                <CardDescription>All user reviews for this show.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Episode</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {show.reviews.length > 0 ? (
                      show.reviews.map(review => {
                        const rec = review.extraReviews[0]?.episode || review.assignmentReviews[0]?.assignment?.episode;
                        return (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                  {review.user?.image ? (
                                    <Image unoptimized src={review.user.image} alt="" width={24} height={24} className="object-cover" />
                                  ) : (
                                    <User className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                                <span className="font-medium">{review.user?.name || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {review.rating ? (
                                <Badge variant="secondary" className="gap-1">
                                  <RatingIcon value={review.rating.value} />
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {rec ? (
                                <Link
                                  href={`/episode/${rec.id}`}
                                  className="text-primary hover:underline text-sm font-medium"
                                >
                                  Ep. {rec.number}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground text-xs italic">Unlinked</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {review.ReviewdOn ? new Date(review.ReviewdOn).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                          No reviews found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowDetailPage;
