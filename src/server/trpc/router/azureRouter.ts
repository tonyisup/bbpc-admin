import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { env } from "../../../env/server.mjs";
import { BlobServiceClient } from "@azure/storage-blob";

export const azureRouter = router({
	listContainers: protectedProcedure
		.query(async () => {
			const blobServiceClient = BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING);
			const containers = [];
			for await (const container of blobServiceClient.listContainers()) {
				containers.push(container.name);
			}
			return containers;
		}),

	listBlobs: protectedProcedure
		.input(z.object({
			containerName: z.string(),
			continuationToken: z.string().optional(),
			pageSize: z.number().min(1).max(100).default(20),
		}))
		.query(async ({ input }) => {
			const blobServiceClient = BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(input.containerName);

			// List blobs by page
			const iterator = containerClient.listBlobsFlat().byPage({
				maxPageSize: input.pageSize,
				continuationToken: input.continuationToken,
			});

			const response = await iterator.next();

			if (response.done) {
				return {
					blobs: [],
					nextContinuationToken: undefined,
				};
			}

			const segment = response.value;

			const blobs = segment.segment.blobItems.map((blob) => ({
				name: blob.name,
				createdOn: blob.properties.createdOn,
				lastModified: blob.properties.lastModified,
				contentLength: blob.properties.contentLength,
				contentType: blob.properties.contentType,
			}));

			return {
				blobs,
				nextContinuationToken: segment.continuationToken,
			};
		}),
});
