
import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { NewSeasonForm } from "~/components/seasons/NewSeasonForm";
import { SeasonsList } from "~/components/seasons/SeasonsList";
import { trpc } from "~/utils/trpc";

const SeasonPage: NextPage = () => {
  const { data: session } = useSession();
  const { data: seasons, isLoading } = trpc.season.getAll.useQuery();

  return (
    <>
      <Head>
        <title>Seasons</title>
      </Head>
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Seasons</h1>
        {session?.user?.isAdmin && <NewSeasonForm />}
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <SeasonsList seasons={seasons} />
        )}
      </main>
    </>
  );
};

export default SeasonPage;
