import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).end();
  }

  const [{ default: NextAuth }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/server/auth/sqlOptions"),
  ]);
  return NextAuth(req, res, authOptions);
}
