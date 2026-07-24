import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexGameConfigPage = dynamic(
  () =>
    import("@/components/Game/ConvexGameConfigPage").then(
      (module) => module.ConvexGameConfigPage
    ),
  { loading: () => null }
);
const SqlGamblingPage = dynamic(
  () => import("@/components/Game/SqlGamblingPage"),
  { loading: () => null }
);

const GamblingPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexGameConfigPage defaultTab="gambling-types" />
  ) : (
    <SqlGamblingPage />
  );

export default GamblingPage;
