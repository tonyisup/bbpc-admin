import { prisma } from "@prisma/client";
import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const movieRouter = router({
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.movie.count();
    }),
});
