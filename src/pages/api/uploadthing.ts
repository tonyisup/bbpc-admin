import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ error: "Legacy admin uploads are unavailable." });
  }

  const [{ createRouteHandler }, { ourFileRouter }] = await Promise.all([
    import("uploadthing/next-legacy"),
    import("../../server/uploadthing/core"),
  ]);
  return createRouteHandler({ router: ourFileRouter })(req, res);
}
