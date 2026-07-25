import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexUserDetailPage = dynamic(
  () =>
    import("@/components/User/ConvexUserDetailPage").then(
      (module) => module.ConvexUserDetailPage
    ),
  { loading: () => null }
);
const SqlUserDetailPage = dynamic(
  () => import("@/components/User/SqlUserDetailPage"),
  { loading: () => null }
);

interface UserDetailProps {
  userId: string | null;
}

export const getServerSideProps: GetServerSideProps<
  UserDetailProps
> = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: { userId: null } };
  }

  const [{ getServerSession }, { authOptions }, { ssr }] =
    await Promise.all([
      import("next-auth"),
      import("../api/auth/[...nextauth]"),
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
  const userId = Array.isArray(idParam) ? idParam[0] : idParam;
  return userId === undefined
    ? { notFound: true }
    : { props: { userId } };
};

const UserDetailPage: NextPage<UserDetailProps> = ({ userId }) =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexUserDetailPage />
  ) : userId === null ? null : (
    <SqlUserDetailPage />
  );

export default UserDetailPage;
