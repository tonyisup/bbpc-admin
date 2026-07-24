import type { ConvexReactClient } from "convex/react";
import { describe, expect, test, vi } from "vitest";

import { BBPC_CLIENT_API_VERSION } from "./identity";
import {
  ADMIN_EPISODES_PAGE_SIZE,
  createConvexAdminEpisode,
  loadConvexAdminEpisodesPage,
} from "./episodes";

const episode = {
  id: "episode-1",
  number: 123,
  title: "Episode",
  recording: null,
  date: "2026-07-24",
  description: null,
  status: "pending",
  slug: "episode-123",
  assignments: [],
  extras: [],
  links: [],
};

describe("Convex admin episode catalog adapter", () => {
  test("validates native pagination and versions creation", async () => {
    const query = vi.fn().mockResolvedValue({
      page: [episode],
      isDone: true,
      continueCursor: "done",
    });
    const mutation = vi.fn().mockResolvedValue(episode);
    const client = { query, mutation } as unknown as ConvexReactClient;

    await expect(loadConvexAdminEpisodesPage(client, null)).resolves.toEqual({
      episodes: [episode],
      isDone: true,
      continueCursor: "done",
    });
    expect(query).toHaveBeenCalledWith(expect.anything(), {
      paginationOpts: {
        cursor: null,
        numItems: ADMIN_EPISODES_PAGE_SIZE,
      },
    });

    await createConvexAdminEpisode(client, {
      number: episode.number,
      title: episode.title,
    });
    expect(mutation).toHaveBeenCalledWith(expect.anything(), {
      clientApiVersion: BBPC_CLIENT_API_VERSION,
      number: episode.number,
      title: episode.title,
    });
  });

  test("rejects drifted episode relationship collections", async () => {
    const query = vi.fn().mockResolvedValue({
      page: [{ ...episode, assignments: null }],
      isDone: true,
      continueCursor: "done",
    });
    const client = { query } as unknown as ConvexReactClient;

    await expect(loadConvexAdminEpisodesPage(client, null)).rejects.toThrow();
  });
});
