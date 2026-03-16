import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { utapi } from "../../uploadthing";
import { createUniqueAssignmentSlug } from "../../slugs";

export const assignmentRouter = router({
  setType: protectedProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(["HOMEWORK", "EXTRA_CREDIT", "BONUS"])
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.update({
        where: {
          id: req.input.id
        },
        data: {
          type: req.input.type
        }
      })
    }),
  add: protectedProcedure
    .input(z.object({
      userId: z.string(),
      movieId: z.string(),
      episodeId: z.string(),
      type: z.enum(["HOMEWORK", "EXTRA_CREDIT", "BONUS"])
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.$transaction(async (tx) => {
        const [episode, movie, user] = await Promise.all([
          tx.episode.findUnique({
            where: { id: req.input.episodeId },
            select: { number: true },
          }),
          tx.movie.findUnique({
            where: { id: req.input.movieId },
            select: { title: true },
          }),
          tx.user.findUnique({
            where: { id: req.input.userId },
            select: { name: true },
          }),
        ]);

        if (!episode || !movie || !user) {
          throw new Error("Unable to resolve assignment slug source data");
        }

        const assignment = await tx.assignment.create({
          data: {
            userId: req.input.userId,
            movieId: req.input.movieId,
            episodeId: req.input.episodeId,
            type: req.input.type
          }
        });

        const slug = await createUniqueAssignmentSlug(tx, {
          episodeNumber: episode.number,
          userId: req.input.userId,
          userName: user.name,
          movieTitle: movie.title,
          type: req.input.type,
        }, assignment.id);

        return tx.assignment.update({
          where: { id: assignment.id },
          data: { slug },
        });
      });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findUnique({
        where: {
          id: req.input.id
        },
        include: {
          episode: true
        }
      })
    }),
  getForEpisode: publicProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany({
        where: {
          episodeId: req.input.episodeId
        },
        include: {
          assignmentReviews: {
            include: {
              review: {
                include: {
                  rating: true,
                  user: true
                }
              },
              guesses: {
                include: {
                  user: true,
                  rating: true,
                }
              }
            }
          },
          gamblingPoints: {
            include: {
              user: true,
              gamblingType: true,
              targetUser: true,
              point: true
            }
          },
          movie: true,
          user: true
        }
      })
    }),
  getAll: publicProcedure
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany();
    }),
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.query || input.query.length < 2) return [];

      return await ctx.prisma.assignment.findMany({
        where: {
          OR: [
            { movie: { title: { contains: input.query } } },
            { episode: { title: { contains: input.query } } },
            { user: { name: { contains: input.query } } },
          ]
        },
        take: 20,
        include: {
          movie: true,
          episode: true,
          user: true,
        },
        orderBy: {
          episode: {
            date: 'desc'
          }
        }
      });
    }),
  getAudioMessages: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.audioMessage.findMany({
        where: { assignmentId: req.input.assignmentId },
        include: {
          user: true
        }
      })
    }),
  removeAudioMessage: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async (req) => {
      const audioMessage = await req.ctx.prisma.audioMessage.findUnique({
        where: { id: req.input.id },
      });

      if (!audioMessage) {
        throw new Error("Audio message not found");
      }

      if (!audioMessage.fileKey) {
        throw new Error("Audio message not found");
      }
      // Delete from UploadThing
      await utapi.deleteFiles([audioMessage.fileKey]);

      // Delete from Prisma database
      await req.ctx.prisma.audioMessage.delete({
        where: { id: req.input.id },
      });

      return { success: true };
    }),
})
