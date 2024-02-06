import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const assignmentRouter = router({
  setHomework: publicProcedure
    .input(z.object({
      id: z.string(),
      homework: z.boolean()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.update({
        where: {
          id: req.input.id
        },
        data: {
          homework: req.input.homework
        }
      })
    }),
  add: publicProcedure
    .input(z.object({
      userId: z.string(),
      movieId: z.string(),
      episodeId: z.string(),
      homework: z.boolean()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.create({
        data: {
          userId: req.input.userId,
          movieId: req.input.movieId,
          episodeId: req.input.episodeId,
          homework: req.input.homework
        }
      })
    }),
  remove: publicProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  get: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  getForEpisode: publicProcedure
    .input(z.object({episodeId: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany({
        where: {
          episodeId: req.input.episodeId
        }, 
        include: {
          assignmentReviews: true,
          Movie: true,
          User: true
        }
      })
    }),
  getAll: publicProcedure
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany();
    }),
})