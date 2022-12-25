import { prisma } from "@prisma/client";
import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const movieRouter = router({
  search: publicProcedure
    .input(z.object({ 
      searchTerm: z.string(),
      page: z.number().optional().default(1),
    }))
    .query(({ ctx, input }) => {
      return ctx.tmdb.getMovies(input.page, input.searchTerm)
    }),
  add: publicProcedure
    .input(z.object({
      title: z.string(),
      year: z.number(),
      poster: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.movie.create({
        data: {          
          title: req.input.title,
          year: req.input.year,
          poster: req.input.poster,
          url: ""
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
