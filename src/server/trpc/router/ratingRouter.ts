import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const ratingRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.rating.findMany({
      orderBy: {
        value: "desc",
      },
    });
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.rating.findUnique({
        where: { id: input.id },
      });
    }),

  add: protectedProcedure
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        value: z.number(),
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

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.rating.delete({
        where: { id: input.id },
      });
    }),
});
