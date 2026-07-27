import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexAssignmentDetailPage = dynamic(
  () =>
    import(
      "@/components/Assignment/ConvexAssignmentDetailPage"
    ).then((module) => module.ConvexAssignmentDetailPage),
  { loading: () => null }
);
const SqlAssignmentDetailPage = dynamic(
  () =>
    import("@/components/Assignment/SqlAssignmentDetailPage"),
  { loading: () => null }
);

interface AssignmentDetailProps {
  assignmentId: string | null;
}

export const getServerSideProps: GetServerSideProps<
  AssignmentDetailProps
> = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return { props: { assignmentId: null } };
  }

  const [
    { getServerSession },
    { authOptions },
    { ssr },
    { getAdminAssignmentPath },
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
  const routeParam = Array.isArray(slugParam)
    ? slugParam[0]
    : slugParam;
  if (routeParam === undefined) {
    return { notFound: true };
  }
  const { assignment, shouldRedirect } =
    await ssr.resolveAssignmentRouteParam(routeParam);
  if (assignment === null) {
    return { notFound: true };
  }
  if (shouldRedirect && assignment.slug) {
    return {
      redirect: {
        destination: getAdminAssignmentPath(assignment.slug),
        permanent: true,
      },
    };
  }
  return { props: { assignmentId: assignment.id } };
};

const AssignmentDetailPage: NextPage<AssignmentDetailProps> = ({
  assignmentId,
}) =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexAssignmentDetailPage />
  ) : assignmentId === null ? null : (
    <SqlAssignmentDetailPage assignmentId={assignmentId} />
  );

export default AssignmentDetailPage;
