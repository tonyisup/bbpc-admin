import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexSeasonsPage = dynamic(
  () =>
    import("@/components/seasons/ConvexSeasonsPage").then(
      (module) => module.ConvexSeasonsPage
    ),
  { loading: () => null }
);
const SqlSeasonsPage = dynamic(
  () => import("@/components/seasons/SqlSeasonsPage"),
  { loading: () => null }
);

const SeasonsPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexSeasonsPage />
  ) : (
    <SqlSeasonsPage />
  );

export default SeasonsPage;
