import { prisma } from "@prisma/client";
import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const movieRouter = router({
  find: publicProcedure
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
  search: publicProcedure
    .input(z.object({ 
      searchTerm: z.string(),
      page: z.number().optional().default(1),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getMovies(input.page, input.searchTerm)
    }),
  getTitle: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getMovie(input.id)
    }),
  add: publicProcedure
    .input(z.object({
      title: z.string(),
      year: z.number(),
      poster: z.string(),
      url: z.string(),
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
          }
        })
      }
      return await req.ctx.prisma.movie.create({
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
      return ctx.prisma.movie.findUnique({
        where: { id: input.id },
      });
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.count();
    }),
});
