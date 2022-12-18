import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const episodeRouter = router({
  add: publicProcedure
    .input(z.object({number: z.number(), title: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.create({
        data: {
          number: req.input.number,
          title: req.input.title   
        }
      })
    }),
  remove: publicProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: publicProcedure
    .input(z.object({id: z.string(), number: z.number(), title: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.update({
        where: {
          id: req.input.id
        },
        data: {
          number: req.input.number,
          title: req.input.title
        }
      })
    }),
  get: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.episode.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.episode.count();
    }),
});