import { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";
import { env } from "../../../env/server.mjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // Attempt to get user session
  const session = await getServerSession(req, res, authOptions);

  // Default guest data
  let user_id = `guest-${Math.random().toString(36).substr(2, 9)}`;
  let user_info = {
    name: "Guest",
    isGuest: true,
  };

  if (session && session.user) {
    user_id = session.user.id;
    user_info = {
      name: session.user.name || "User",
      isGuest: false,
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
