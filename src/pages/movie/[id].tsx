import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft } from "lucide-react";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import { Button } from "../../components/ui/button";
import MediaDetailPage from "../../components/Media/MediaDetailPage";

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

const MovieDetailPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { query } = useRouter();
  const id = query.id as string;

  const { data: movie, isLoading } = trpc.movie.get.useQuery(
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

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-bold">Movie not found</h2>
        <Button asChild variant="outline">
          <Link href="/movie">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
        </Button>
      </div>
    );
  }

  return <MediaDetailPage media={movie} type="movie" />;
};

export default MovieDetailPage;
