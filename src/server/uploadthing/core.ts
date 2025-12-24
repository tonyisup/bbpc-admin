import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env/server.mjs";

const f = createUploadthing();

const auth = (req: NextApiRequest, res: NextApiResponse) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, res }) => {
      // This code runs on your server before upload
      const user = await auth(req, res);

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      // Trigger n8n webhook
      await fetch(env.AUDIO_CHAPTERIZER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl: file.url }),
      })
        .then((res) => {
          if (!res.ok) console.error("Failed to trigger webhook:", res.statusText);
          else console.log("Webhook triggered successfully");
        })
        .catch((err) => console.error("Error triggering webhook:", err));

      // Trigger n8n webhook
      await fetch(env.AUDIO_CHAPTERIZER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl: file.url }),
      })
        .then((res) => {
          if (!res.ok) console.error("Failed to trigger webhook:", res.statusText);
          else console.log("Webhook triggered successfully");
        })
        .catch((err) => console.error("Error triggering webhook:", err));

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  audioUploader: f({ audio: { maxFileSize: "4MB" } })
    .middleware(async ({ req, res }) => {
      const user = await auth(req, res);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      const triggerN8NWebhook = await fetch(env.AUDIO_CHAPTERIZER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKey: file.key,
          fileUrl: file.url,
        }),
      });
      console.log("triggerN8NWebhook", await triggerN8NWebhook.json());
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
