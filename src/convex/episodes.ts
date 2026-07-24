import type { ConvexReactClient } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { z } from "zod";

import { BBPC_CLIENT_API_VERSION } from "./identity";

const episodeSchema = z.object({
  id: z.string().min(1),
  number: z.number(),
  title: z.string(),
  recording: z.string().nullable(),
  date: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  slug: z.string().nullable(),
  assignments: z.array(z.unknown()),
  extras: z.array(z.unknown()),
  links: z.array(z.unknown()),
});

const episodesPageSchema = z.object({
  page: z.array(episodeSchema),
  isDone: z.boolean(),
  continueCursor: z.string(),
  splitCursor: z.string().nullable().optional(),
  pageStatus: z
    .enum(["SplitRecommended", "SplitRequired"])
    .nullable()
    .optional(),
});

const listEpisodesReference = makeFunctionReference<
  "query",
  {
    paginationOpts: {
      cursor: string | null;
      numItems: number;
    };
  },
  unknown
>("episodes/public:listPage");

const createEpisodeReference = makeFunctionReference<
  "mutation",
  {
    clientApiVersion: string;
    number: number;
    title: string;
  },
  unknown
>("episodes/admin:createEpisode");

export const ADMIN_EPISODES_PAGE_SIZE = 20;

export type ConvexAdminEpisode = z.infer<typeof episodeSchema>;

export interface ConvexAdminEpisodesPage {
  episodes: ConvexAdminEpisode[];
  isDone: boolean;
  continueCursor: string;
}

export async function loadConvexAdminEpisodesPage(
  client: ConvexReactClient,
  cursor: string | null
): Promise<ConvexAdminEpisodesPage> {
  const result = episodesPageSchema.parse(
    await client.query(listEpisodesReference, {
      paginationOpts: {
        cursor,
        numItems: ADMIN_EPISODES_PAGE_SIZE,
      },
    })
  );
  return {
    episodes: result.page,
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}

export async function createConvexAdminEpisode(
  client: ConvexReactClient,
  input: { number: number; title: string }
): Promise<void> {
  episodeSchema.parse(
    await client.mutation(createEpisodeReference, {
      clientApiVersion: BBPC_CLIENT_API_VERSION,
      number: input.number,
      title: input.title,
    })
  );
}
