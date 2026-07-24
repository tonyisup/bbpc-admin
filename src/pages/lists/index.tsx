import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexRankedListsPage = dynamic(
  () =>
    import("@/components/Ranking/ConvexRankedListsPage").then(
      (module) => module.ConvexRankedListsPage
    ),
  { loading: () => null }
);
const SqlRankedListsPage = dynamic(
  () => import("@/components/Ranking/SqlRankedListsPage"),
  { loading: () => null }
);

const RankedListsPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexRankedListsPage />
  ) : (
    <SqlRankedListsPage />
  );

export default RankedListsPage;
