import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexEpisodeDetailPage = dynamic(
  () =>
    import("@/components/Episode/ConvexEpisodeDetailPage").then(
      (module) => module.ConvexEpisodeDetailPage
    ),
  { loading: () => null }
);
const SqlEpisodeDetailPage = dynamic(
  () => import("@/components/Episode/SqlEpisodeDetailPage"),
  { loading: () => null }
);

interface EpisodeDetailProps {
  episodeId: string | null;
}

export const getServerSideProps: GetServerSideProps<
  EpisodeDetailProps
> = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: { episodeId: null } };
  }

  const [
    { getServerSession },
    { authOptions },
    { ssr },
    { getAdminEpisodePath },
  ] = await Promise.all([
    import("next-auth"),
    import("@/server/auth/sqlOptions"),
    import("@/server/db/ssr"),
    import("@/lib/routes"),
  ]);
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );
  const isAdmin = await ssr.isAdmin(session?.user?.id ?? "");
  if (session === null || !isAdmin) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  const slugParam = context.params?.slug;
  const routeParam = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (routeParam === undefined) {
    return { notFound: true };
  }
  const { episode, shouldRedirect } =
    await ssr.resolveEpisodeRouteParam(routeParam);
  if (episode === null) {
    return { notFound: true };
  }
  if (shouldRedirect && episode.slug) {
    return {
      redirect: {
        destination: getAdminEpisodePath(episode.slug),
        permanent: true,
      },
    };
  }
  return { props: { episodeId: episode.id } };
};

const EpisodeDetailPage: NextPage<EpisodeDetailProps> = ({ episodeId }) =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexEpisodeDetailPage />
  ) : episodeId === null ? null : (
    <SqlEpisodeDetailPage episodeId={episodeId} />
  );

export default EpisodeDetailPage;
