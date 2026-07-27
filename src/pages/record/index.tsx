import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

import type { SqlRecordPageProps } from "@/components/Recording/SqlRecordPage";

const SqlRecordPage = dynamic<SqlRecordPageProps>(
  () => import("@/components/Recording/SqlRecordPage"),
  { loading: () => null }
);

export const getServerSideProps: GetServerSideProps<
  SqlRecordPageProps
> = async (context) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    return {
      redirect: {
        destination: "/?unavailable=%2Frecord",
        permanent: false,
      },
    };
  }

  return (await import("@/server/sql/recordPage"))
    .getSqlRecordServerSideProps(context);
};

const RecordPage: NextPage<SqlRecordPageProps> = (props) =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? null : (
    <SqlRecordPage {...props} />
  );

export default RecordPage;
