import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import EpisodeAssignments from "../../components/Assignment/EpisodeAssignments";
import { trpc } from "../../utils/trpc";

const Episode: NextPage = () => {
  const { query } = useRouter();
  const id = query.id as string;
  const { data: episode } = trpc.episode.get.useQuery({ id });
  return (
    <>
      <Head>
        <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center">
        <header className="flex my-6 px-6 w-full justify-center">
          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>
        </header>

				{episode && <EpisodeAssignments episode={episode} />}
      </main>
    </>
  );
};

export default Episode;