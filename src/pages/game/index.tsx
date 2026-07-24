import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexGameConfigPage = dynamic(
  () =>
    import("@/components/Game/ConvexGameConfigPage").then(
      (module) => module.ConvexGameConfigPage
    ),
  { loading: () => null }
);
const SqlGameConfigPage = dynamic(
  () => import("@/components/Game/SqlGameConfigPage"),
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

const GameConfigPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexGameConfigPage />
  ) : (
    <SqlGameConfigPage />
  );

export default GameConfigPage;
