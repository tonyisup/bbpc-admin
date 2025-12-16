import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import EpisodeAssignments from "../../components/Assignment/EpisodeAssignments";
import EpisodeExtras from "../../components/Extra/EpisodeExtras";
import { trpc } from "../../utils/trpc";
import EpisodeLinks from "../../components/Link/EpisodeLinks";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import EpisodeAudioMessages from "../../components/Episode/EpisodeAudioMessages";
import EpisodeEditor from "../../components/Episode/EpisodeEditor";
import EpisodePlainView from "../../components/Episode/EpisodePlainView";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const isAdmin = await ssr.isAdmin(session?.user?.id || "");

  if (!session || !isAdmin) {
    return {
      redirect: {
        destionation: '/',
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
const Episode: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {

  const { query } = useRouter();
  const id = query.id as string;

  const { data: episode, refetch } = trpc.episode.get.useQuery({
    id
  });

  return (
    <>
      <Head>
        <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center gap-2">
        <header className="grid grid-cols-3 items-center justify-items-center w-full">
          <Link className="p-4" href="/episode">
            Episodes
          </Link>

          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>

          <div />
        </header>
        {episode && <EpisodeEditor episode={episode} onEpisodeUpdated={refetch} />}
        {episode && <EpisodeAssignments episode={episode} />}
        {episode && <EpisodeExtras episode={episode} />}
        {episode && <EpisodeLinks episode={episode} />}
        {episode && <EpisodeAudioMessages episode={episode} />}
        {episode && <EpisodePlainView episodeId={episode.id} episodeNumber={episode.number} />}
      </main>
    </>
  );
};

export default Episode;