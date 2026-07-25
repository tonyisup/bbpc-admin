import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexSeasonDetailPage = dynamic(
  () =>
    import("@/components/seasons/ConvexSeasonDetailPage").then(
      (module) => module.ConvexSeasonDetailPage
    ),
  { loading: () => null }
);
const SqlSeasonDetailPage = dynamic(
  () => import("@/components/seasons/SqlSeasonDetailPage"),
  { loading: () => null }
);

const SeasonDetailPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexSeasonDetailPage />
  ) : (
    <SqlSeasonDetailPage />
  );

export default SeasonDetailPage;
