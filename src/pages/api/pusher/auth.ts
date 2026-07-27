import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex") {
    res.setHeader("Cache-Control", "no-store");
    return res
      .status(503)
      .json({ message: "Legacy Pusher signaling is unavailable." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  if (!socketId || !channel) {
    return res.status(400).json({ message: "Missing socket_id or channel_name" });
  }

  const [
    { pusher },
    { ssr },
    { getServerSession },
    { authOptions },
  ] = await Promise.all([
    import("../../../lib/pusher"),
    import("../../../server/db/ssr"),
    import("next-auth"),
    import("../../../server/auth/sqlOptions"),
  ]);

  // Attempt to get user session
  const session = await getServerSession(req, res, authOptions);

  // Default guest data
  let user_id = `guest-${Math.random().toString(36).substring(2, 9)}`;
  let user_info = {
    name: "Guest",
    isGuest: true,
    isAdmin: false,
  };

  if (session && session.user) {
    user_id = session.user.id;
    const isAdmin = await ssr.isAdmin(session.user.id);
    user_info = {
      name: session.user.name || "User",
      isGuest: false,
      isAdmin,
    };
  } else {
    // If guest, try to get name from body if passed (handled by client logic calling auth endpoint?)
    // Standard Pusher auth call sends socket_id and channel_name.
    // We can pass extra data in headers or query if we modify the client,
    // but typically the client library just posts form data.
    // The client CAN pass extra params if configured in the Pusher constructor options `auth: { params: { ... } }`
    if (req.body.username) {
      user_info.name = req.body.username;
    }
  }

  const presenceData = {
    user_id,
    user_info,
  };

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    res.status(500).json({ message: "Auth failed" });
  }
}
