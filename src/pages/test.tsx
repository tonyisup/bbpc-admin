import type { NextPage } from "next";
import dynamic from "next/dynamic";

const sqlBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex";
const SqlUploadTestPage = sqlBackendSelected
  ? dynamic(() => import("@/components/Legacy/SqlUploadTestPage"), {
      loading: () => null,
    })
  : null;

const UploadTestPage: NextPage = () => {
  if (!sqlBackendSelected) {
    return null;
  }
  if (SqlUploadTestPage === null) {
    throw new Error("SQL mode requires the legacy upload test page.");
  }
  return <SqlUploadTestPage />;
};

export default UploadTestPage;
