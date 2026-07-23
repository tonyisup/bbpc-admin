import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../trpc";

export const showRouter = router({
  find: protectedProcedure
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
  search: protectedProcedure
    .input(z.object({
      searchTerm: z.string(),
      page: z.number().optional().default(1),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getShows(input.page, input.searchTerm)
    }),
  getTitle: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getShow(input.id)
    }),
  add: protectedProcedure
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
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.show.findUnique({
        where: { id: input.id },
        include: {
          reviews: {
            include: {
              user: true,
              rating: true,
              extraReviews: {
                include: {
                  episode: true,
                }
              },
              assignmentReviews: {
                include: {
                  assignment: {
                    include: {
                      episode: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
    }),
  getAll: adminProcedure
    .query(({ ctx }) => {
      return ctx.prisma.show.findMany();
    }),
  getSummary: adminProcedure
    .query(({ ctx }) => {
      return ctx.prisma.show.count();
    }),
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string(),
      year: z.number(),
      poster: z.string().optional(),
      url: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.show.update({
        where: { id },
        data,
      });
    }),
  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.show.delete({
        where: { id: input.id },
      });
    }),
});
