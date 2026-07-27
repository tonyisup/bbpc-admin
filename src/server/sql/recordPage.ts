import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";

import type { SqlRecordPageProps } from "@/components/Recording/SqlRecordPage";
import { authOptions } from "@/server/auth/sqlOptions";
import { ssr } from "@/server/db/ssr";

export const getSqlRecordServerSideProps: GetServerSideProps<
  SqlRecordPageProps
> = async (context) => {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );
  const isAdmin = await ssr.isAdmin(session?.user?.id ?? "");
  const isGuest = context.query.guest === "true";

  if (session === null || (!isAdmin && !isGuest)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
      isAdmin,
    },
  };
};
