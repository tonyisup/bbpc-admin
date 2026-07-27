import type { NextPage } from "next";
import dynamic from "next/dynamic";

const sqlBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex";
const SqlAudioTestPage = sqlBackendSelected
  ? dynamic(() => import("@/components/Legacy/SqlAudioTestPage"), {
      loading: () => null,
    })
  : null;

const AudioTestPage: NextPage = () => {
  if (!sqlBackendSelected) {
    return null;
  }
  if (SqlAudioTestPage === null) {
    throw new Error("SQL mode requires the legacy audio test page.");
  }
  return <SqlAudioTestPage />;
};

export default AudioTestPage;
