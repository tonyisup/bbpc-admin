import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ConvexSideEffectsPage = dynamic(
  () =>
    import("@/components/System/ConvexSideEffectsPage").then(
      (module) => module.ConvexSideEffectsPage
    ),
  { loading: () => null }
);

const SideEffectsPage: NextPage = () =>
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" ? (
    <ConvexSideEffectsPage />
  ) : null;

export default SideEffectsPage;
