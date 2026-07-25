import type { ConvexReactClient } from "convex/react";
import { describe, expect, test, vi } from "vitest";

import { BBPC_CLIENT_API_VERSION } from "./identity";
import {
  ADMIN_EPISODE_AUDIO_PAGE_SIZE,
  addConvexAdminEpisodeAudio,
  addConvexAdminEpisodeLink,
  loadConvexAdminEpisodeAudioPage,
  loadConvexAdminEpisodeByNumber,
  loadConvexAdminEpisodeBySlug,
  removeConvexAdminEpisodeAudio,
  removeConvexAdminEpisodeLink,
  updateConvexAdminEpisode,
} from "./episodeDetails";

const episode = {
  id: "episode-1",
  number: 12,
  title: "Episode Twelve",
  recording: null,
  date: "2026-07-24",
  description: "Description",
  status: "published",
  slug: "episode-twelve",
  assignments: [],
  extras: [],
  links: [],
  notes: null,
  seoDescription: null,
  seoKeywords: null,
  seoTitle: null,
};

const audioMessage = {
  id: "audio-1",
  url: "https://audio.example.test/one.webm",
  createdAt: 100,
  fileKey: null,
  episodeId: episode.id,
  notes: "Listener note",
  user: {
    id: "user-1",
    name: "Example User",
    email: "user@example.test",
    image: null,
    status: "active" as const,
  },
};

describe("Convex episode detail adapter", () => {
  test("resolves canonical slugs and validates episode snapshots", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(episode)
      .mockResolvedValueOnce(episode)
      .mockResolvedValueOnce(episode);
    const mutation = vi.fn().mockResolvedValue(episode);
    const client = { query, mutation } as unknown as ConvexReactClient;

    await expect(
      loadConvexAdminEpisodeBySlug(client, episode.slug)
    ).resolves.toEqual(episode);
    await expect(
      loadConvexAdminEpisodeByNumber(client, episode.number)
    ).resolves.toEqual(episode);

    await updateConvexAdminEpisode(client, episode, {
      number: episode.number,
      title: episode.title,
      recording: episode.recording,
      date: episode.date,
      description: episode.description,
      status: episode.status,
      notes: episode.notes,
      seoDescription: episode.seoDescription,
      seoKeywords: episode.seoKeywords,
      seoTitle: episode.seoTitle,
      slug: episode.slug,
    });
    expect(mutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientApiVersion: BBPC_CLIENT_API_VERSION,
        id: episode.id,
        expected: expect.objectContaining({
          title: episode.title,
          slug: episode.slug,
        }),
      })
    );
  });

  test("versions links and bounded audio metadata writes", async () => {
    const link = {
      id: "link-1",
      url: "https://example.test/episode",
      text: "Episode link",
    };
    const query = vi.fn().mockResolvedValue({
      page: [audioMessage],
      isDone: true,
      continueCursor: "done",
    });
    const mutation = vi
      .fn()
      .mockResolvedValueOnce(link)
      .mockResolvedValueOnce({ id: link.id })
      .mockResolvedValueOnce(audioMessage)
      .mockResolvedValueOnce({ id: audioMessage.id });
    const client = { query, mutation } as unknown as ConvexReactClient;

    await expect(
      addConvexAdminEpisodeLink(client, episode.id, {
        url: link.url,
        text: link.text,
      })
    ).resolves.toEqual(link);
    await removeConvexAdminEpisodeLink(client, episode.id, link);
    await expect(
      loadConvexAdminEpisodeAudioPage(client, episode.id, null)
    ).resolves.toMatchObject({
      messages: [audioMessage],
      isDone: true,
    });
    expect(query).toHaveBeenCalledWith(expect.anything(), {
      episodeId: episode.id,
      paginationOpts: {
        cursor: null,
        numItems: ADMIN_EPISODE_AUDIO_PAGE_SIZE,
      },
    });
    await expect(
      addConvexAdminEpisodeAudio(client, episode.id, {
        url: audioMessage.url,
        notes: audioMessage.notes,
      })
    ).resolves.toEqual(audioMessage);
    await removeConvexAdminEpisodeAudio(client, audioMessage);
    expect(mutation).toHaveBeenLastCalledWith(expect.anything(), {
      clientApiVersion: BBPC_CLIENT_API_VERSION,
      id: audioMessage.id,
      expected: {
        episodeId: episode.id,
        url: audioMessage.url,
        fileKey: null,
        createdAt: audioMessage.createdAt,
      },
    });
  });

  test("rejects slug drift and cross-episode audio", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(episode)
      .mockResolvedValueOnce({ ...episode, slug: "changed" })
      .mockResolvedValueOnce({
        page: [
          {
            ...audioMessage,
            episodeId: "episode-2",
          },
        ],
        isDone: true,
        continueCursor: "done",
      });
    const client = { query } as unknown as ConvexReactClient;

    await expect(
      loadConvexAdminEpisodeBySlug(client, episode.slug)
    ).rejects.toThrow(/slug changed/u);
    await expect(
      loadConvexAdminEpisodeAudioPage(client, episode.id, null)
    ).rejects.toThrow(/requested episode/u);
  });
});
