import { NextApiRequest, NextApiResponse } from "next";
import { pusher } from "../../../lib/pusher";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { signal, to, from } = req.body;

  if (!signal || !to || !from) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // We send the signal to the specific user via a private channel dedicated to them,
    // OR we just use client events on the presence channel.
    // But since we want to avoid "Client Events" dependency which might be off:
    // We trigger an event on the presence channel, but maybe that's too much noise if we broadcast?
    // "pusher.trigger" broadcasts to the channel.

    // Better pattern: Trigger an event on a channel that ONLY the target is listening to.
    // e.g. "private-user-{userId}"
    // But for simplicity in this mesh, let's just use the main presence channel and have clients filter?
    // No, sending offer/answer to EVERYONE is bad for bandwidth.

    // Use `socket_id` exclusion? `pusher.trigger(channel, event, data, [socket_id])` excludes the sender.
    // But we want to target ONE specific person.

    // Option: Use the target's socket ID as a channel name? No, socket IDs are ephemeral.
    // The target is `to` (which is a socket ID or user ID?).
    // In `simple-peer` mesh, we usually signal `to` a specific peer.

    // Let's assume `to` is the target's `socket_id`.
    // We can't trigger an event to a specific socket ID easily without a channel they are on.
    // If we use the presence channel, EVERYONE receives the event.
    // Clients can ignore signals not meant for them.
    // Payload: { signal, to, from }
    // Client: if (data.to === myFunctionToGetMySocketId()) { handle }
    // This is okay for small groups (podcasts = < 10 people).

    await pusher.trigger("presence-audio", "signal", {
      signal,
      to,
      from,
    });

    res.status(200).json({ message: "Signal sent" });
  } catch (error) {
    console.error("Pusher signal error:", error);
    res.status(500).json({ message: "Signal failed" });
  }
}
