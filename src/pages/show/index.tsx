import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexMediaCatalogPage = dynamic(
  () =>
    import("@/components/Media/ConvexMediaCatalogPage").then(
      (module) => module.ConvexMediaCatalogPage
    ),
  { loading: () => null }
);
const SqlShowsPage = dynamic(
  () => import("@/components/Show/SqlShowsPage"),
  { loading: () => null }
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: {} };
  }

  const [{ getServerSession }, { ssr }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/server/db/ssr"),
    import("@/server/auth/sqlOptions"),
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

const ShowsPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexMediaCatalogPage kind="show" />
  ) : (
    <SqlShowsPage />
  );

export default ShowsPage;
