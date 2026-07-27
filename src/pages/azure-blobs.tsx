import type { NextPage } from "next";
import dynamic from "next/dynamic";

const sqlBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex";
const SqlAzureBlobsPage = sqlBackendSelected
  ? dynamic(() => import("@/components/Azure/SqlAzureBlobsPage"), {
      loading: () => null,
    })
  : null;

const AzureBlobsPage: NextPage = () => {
  if (!sqlBackendSelected) {
    return null;
  }
  if (SqlAzureBlobsPage === null) {
    throw new Error("SQL mode requires the legacy Azure storage explorer.");
  }
  return <SqlAzureBlobsPage />;
};

export default AzureBlobsPage;
