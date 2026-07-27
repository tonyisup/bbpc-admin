import { type NextApiRequest, type NextApiResponse } from "next";

const restricted = async (req: NextApiRequest, res: NextApiResponse) => {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ error: "This legacy admin route is unavailable." });
  }

  const { getServerAuthSession } = await import(
    "../../server/common/get-server-auth-session"
  );
  const session = await getServerAuthSession({ req, res });

  if (session) {
    res.send({
      content:
        "This is protected content. You can access this content because you are signed in.",
    });
  } else {
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
};

export default restricted;
