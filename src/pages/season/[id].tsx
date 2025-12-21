
import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { SeasonDetails } from "@/components/seasons/SeasonDetails";
import { trpc } from "@/utils/trpc";

const SeasonDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: season, isLoading } = trpc.season.getById.useQuery({
    id: id as string,
  });

  return (
    <>
      <Head>
        <title>{season?.title}</title>
      </Head>
      <main className="container mx-auto py-8">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          season && <SeasonDetails season={season} />
        )}
      </main>
    </>
  );
};

export default SeasonDetailPage;
