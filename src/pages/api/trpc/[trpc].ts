import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).end();
  }

  const [{ createNextApiHandler }, { createContext }, { appRouter }] =
    await Promise.all([
      import("@trpc/server/adapters/next"),
      import("../../../server/trpc/context"),
      import("../../../server/trpc/router/_app"),
    ]);

  return createNextApiHandler({
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path}: ${error}`);
          }
        : undefined,
  })(req, res);
}
