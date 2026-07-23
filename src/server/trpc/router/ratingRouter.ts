import { z } from "zod";
import { adminProcedure, router } from "../trpc";

export const ratingRouter = router({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.rating.findMany({
      orderBy: {
        value: "desc",
      },
    });
  }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.rating.findUnique({
        where: { id: input.id },
      });
    }),

  add: adminProcedure
    .input(
      z.object({
        name: z.string(),
        value: z.number(),
        sound: z.string().optional(),
        icon: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.rating.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        value: z.number().optional(),
        sound: z.string().optional(),
        icon: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.rating.update({
        where: { id },
        data,
      });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.rating.delete({
        where: { id: input.id },
      });
    }),
});
