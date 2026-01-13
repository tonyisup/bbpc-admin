import { z } from "zod";
import { router, publicProcedure, protectedProcedure, createCallerFactory } from "../trpc";
import { getCurrentSeasonID } from "../utils/points";
import { tmdb } from "@/server/tmdb/client";
import { movieRouter } from "./movieRouter";

export const tagRouter = router({
  // Tag model
  getTags: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  addTag: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tag.create({
        data: input,
      });
    }),

  updateTag: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.tag.update({
        where: { id },
        data,
      });
    }),

  removeTag: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tag.delete({
        where: { id: input.id },
      });
    }),

  // TagVote model
  getTagVotes: publicProcedure
    .input(z.object({
      tmdbId: z.number().optional(),
      take: z.number().optional().default(100),
      skip: z.number().optional().default(0)
    }))
    .query(async ({ ctx, input }) => {
      const where = input.tmdbId ? { tmdbId: input.tmdbId } : {};
      return await ctx.prisma.tagVote.findMany({
        where,
        take: input.take,
        skip: input.skip,
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  removeTagVote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tagVote.delete({
        where: { id: input.id },
      });
    }),

  getTagVotesForUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.tagVote.findMany({
        where: { userId: input.userId },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  applyTagVotePoints: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vote = await ctx.prisma.tagVote.findUnique({
        where: { id: input.id },
      });

      if (!vote || vote.pointId) {
        throw new Error("Vote not found or already has points");
      }

      const gamePointType = await ctx.prisma.gamePointType.findFirst({
        where: { lookupID: "tag-vote" },
      });

      const movie = await ctx.prisma.movie.findFirst({
        where: { tmdbId: vote.tmdbId },
      });
      let movieTitle = movie?.title;

      const seasonId = await getCurrentSeasonID(ctx.prisma);

      if (!gamePointType) {
        throw new Error("GamePointType not found");
      }

      if (!seasonId) {
        throw new Error("Season not found");
      }

      if (!vote.userId) {
        throw new Error("User ID not found");
      }
      if (!movieTitle) {
        if (!vote.tmdbId) {
          throw new Error("Voted movie has invalid TMDB ID");
        }
        const tmdbMovie = await tmdb.getMovie(vote.tmdbId);
        if (!tmdbMovie) {
          throw new Error("Movie not found");
        }
        movieTitle = tmdbMovie.title;
      }


      return await ctx.prisma.$transaction(async (tx) => {
        const point = await tx.point.create({
          data: {
            userId: vote.userId!,
            seasonId: seasonId,
            gamePointTypeId: gamePointType.id,
            adjustment: 0,
            reason: `Voted on tag: ${vote.tag} for movie: ${movieTitle}`,
            earnedOn: new Date(),
          },
        });

        return await tx.tagVote.update({
          where: { id: vote.id },
          data: { pointId: point.id },
        });
      });
    }),
});
