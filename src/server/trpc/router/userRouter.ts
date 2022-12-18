import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const episodeRouter = router({
  add: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.create({
        data: {
          name: req.input.name,
          email: req.input.email,
        }
      })
    }),
  remove: publicProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(), 
      name: z.string(),
      email: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.update({
        where: {
          id: req.input.id
        },
        data: {
          name: req.input.name,
          email: req.input.email,
        }
      })
    }),
  get: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.user.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
});
