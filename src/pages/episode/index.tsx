import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexEpisodesPage = dynamic(
  () =>
    import("@/components/Episode/ConvexEpisodesPage").then(
      (module) => module.ConvexEpisodesPage
    ),
  { loading: () => null }
);
const SqlEpisodesPage = dynamic(
  () => import("@/components/Episode/SqlEpisodesPage"),
  { loading: () => null }
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: {} };
  }

  const [{ getServerSession }, { ssr }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/server/db/ssr"),
    import("../api/auth/[...nextauth]"),
  ]);
  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = await ssr.isAdmin(session?.user?.id ?? "");

  if (session === null || !isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: { session } };
};

const EpisodesPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexEpisodesPage />
  ) : (
    <SqlEpisodesPage />
  );

export default EpisodesPage;
