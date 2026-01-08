import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { utapi } from "../../uploadthing";

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
      return await req.ctx.prisma.assignment.create({
        data: {
          userId: req.input.userId,
          movieId: req.input.movieId,
          episodeId: req.input.episodeId,
          type: req.input.type
        }
      })
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