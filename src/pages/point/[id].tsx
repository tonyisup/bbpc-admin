import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexPointDetailPage = dynamic(
  () =>
    import("@/components/Point/ConvexPointDetailPage").then(
      (module) => module.ConvexPointDetailPage
    ),
  { loading: () => null }
);
const SqlPointDetailPage = dynamic(
  () => import("@/components/Point/SqlPointDetailPage"),
  { loading: () => null }
);

interface PointDetailProps {
  pointId: string | null;
}

export const getServerSideProps: GetServerSideProps<
  PointDetailProps
> = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: { pointId: null } };
  }

  const [{ getServerSession }, { authOptions }, { ssr }] =
    await Promise.all([
      import("next-auth"),
      import("@/server/auth/sqlOptions"),
      import("@/server/db/ssr"),
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

  const idParam = context.params?.id;
  const pointId = Array.isArray(idParam) ? idParam[0] : idParam;
  return pointId === undefined
    ? { notFound: true }
    : { props: { pointId } };
};

const PointDetailPage: NextPage<PointDetailProps> = ({ pointId }) =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexPointDetailPage />
  ) : pointId === null ? null : (
    <SqlPointDetailPage />
  );

export default PointDetailPage;
