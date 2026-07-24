import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexRankingTypesPage = dynamic(
  () =>
    import("@/components/Ranking/ConvexRankingTypesPage").then(
      (module) => module.ConvexRankingTypesPage
    ),
  { loading: () => null }
);
const SqlRankedTypesPage = dynamic(
  () => import("@/components/Ranking/SqlRankedTypesPage"),
  { loading: () => null }
);

const RankingTypesPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexRankingTypesPage />
  ) : (
    <SqlRankedTypesPage />
  );

export default RankingTypesPage;
