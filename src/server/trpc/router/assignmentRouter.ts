import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const assignmentRouter = router({
  add: publicProcedure
    .input(z.object({
      episodeId: z.string(),
      movieId: z.string(),
      userId: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.create({
        data: {
          episodeId: req.input.episodeId,
          movieId: req.input.movieId,
          userId: req.input.userId,
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
          reviews: true,
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