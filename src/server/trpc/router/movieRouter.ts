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
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.count();
    }),
});
