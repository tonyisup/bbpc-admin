import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const roleRouter = router({
  get: publicProcedure
    .input(z.object({id: z.number()}))
    .query(async (req) => {
      return await req.ctx.prisma.role.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.role.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.role.count();
    }),
});
