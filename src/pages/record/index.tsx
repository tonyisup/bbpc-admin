import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";

import type { SqlRecordPageProps } from "@/components/Recording/SqlRecordPage";

const convexBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex";
const SqlRecordPage = convexBackendSelected
  ? null
  : dynamic<SqlRecordPageProps>(
      () => import("@/components/Recording/SqlRecordPage"),
      { loading: () => null }
    );

export const getServerSideProps: GetServerSideProps<
  SqlRecordPageProps
> = async (context) => {
  if (convexBackendSelected) {
    const recordingAppUrl =
      process.env.NEXT_PUBLIC_BBPC_RECORDING_URL || undefined;
    return {
      redirect: {
        destination: recordingAppUrl ?? "/?unavailable=%2Frecord",
        permanent: false,
      },
    };
  }

  return (await import("@/server/sql/recordPage"))
    .getSqlRecordServerSideProps(context);
};

const RecordPage: NextPage<SqlRecordPageProps> = (props) => {
  if (convexBackendSelected) {
    return null;
  }
  if (SqlRecordPage === null) {
    throw new Error("SQL mode requires the legacy recording studio.");
  }
  return <SqlRecordPage {...props} />;
};

export default RecordPage;
