import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../trpc";

export const movieRouter = router({
  find: protectedProcedure
    .input(z.object({
      searchTerm: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.movie.findMany({
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
      return ctx.tmdb.getMovies(input.page, input.searchTerm)
    }),
  getTitle: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getMovie(input.id)
    }),
  add: protectedProcedure
    .input(z.object({
      title: z.string(),
      year: z.number(),
      poster: z.string(),
      url: z.string(),
      tmdbId: z.number().optional(),
    }))
    .mutation(async (req) => {
      const exists = await req.ctx.prisma.movie.findFirst({
        where: {
          url: req.input.url
        }
      })
      if (exists) {
        return await req.ctx.prisma.movie.update({
          where: {
            id: exists.id
          },
          data: {
            title: req.input.title,
            year: req.input.year,
            poster: req.input.poster,
            url: req.input.url,
            tmdbId: req.input.tmdbId,
          }
        })
      }
      return await req.ctx.prisma.movie.create({
        data: {
          title: req.input.title,
          year: req.input.year,
          poster: req.input.poster,
          url: req.input.url,
          tmdbId: req.input.tmdbId,
        }
      })
    }),
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.movie.findUnique({
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
      return ctx.prisma.movie.findMany({
        include: {
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: {
          title: 'asc'
        }
      });
    }),
  getSummary: adminProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.count();
    }),
  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.movie.delete({
        where: { id: input.id },
      });
    }),
});
