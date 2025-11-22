import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const showRouter = router({
  find: publicProcedure
    .input(z.object({
      searchTerm: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.show.findMany({
        where: {
          title: {
            contains: input.searchTerm,
          }
        }
      })
    }),
  search: publicProcedure
    .input(z.object({
      searchTerm: z.string(),
      page: z.number().optional().default(1),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getShows(input.page, input.searchTerm)
    }),
  getTitle: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getShow(input.id)
    }),
  add: publicProcedure
    .input(z.object({
      title: z.string(),
      year: z.number(),
      poster: z.string(),
      url: z.string(),
    }))
    .mutation(async (req) => {
      const exists = await req.ctx.prisma.show.findFirst({
        where: {
          url: req.input.url
        }
      })
      if (exists) {
        return await req.ctx.prisma.show.update({
          where: {
            id: exists.id
          },
          data: {
            title: req.input.title,
            year: req.input.year,
            poster: req.input.poster,
            url: req.input.url,
          }
        })
      }
      return await req.ctx.prisma.show.create({
        data: {
          title: req.input.title,
          year: req.input.year,
          poster: req.input.poster,
          url: req.input.url,
        }
      })
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.show.findUnique({
        where: { id: input.id },
      });
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.show.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.show.count();
    }),
});
