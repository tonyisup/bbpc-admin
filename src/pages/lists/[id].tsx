import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexRankedListDetailPage = dynamic(
  () =>
    import("@/components/Ranking/ConvexRankedListDetailPage").then(
      (module) => module.ConvexRankedListDetailPage
    ),
  { loading: () => null }
);
const SqlRankedListDetailPage = dynamic(
  () => import("@/components/Ranking/SqlRankedListDetailPage"),
  { loading: () => null }
);

const RankedListDetailPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexRankedListDetailPage />
  ) : (
    <SqlRankedListDetailPage />
  );

export default RankedListDetailPage;
