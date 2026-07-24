import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexRatingsPage = dynamic(
  () =>
    import("@/components/Rating/ConvexRatingsPage").then(
      (module) => module.ConvexRatingsPage
    ),
  { loading: () => null }
);
const SqlRatingsPage = dynamic(
  () => import("@/components/Rating/SqlRatingsPage"),
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

const RatingsPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexRatingsPage />
  ) : (
    <SqlRatingsPage />
  );

export default RatingsPage;
