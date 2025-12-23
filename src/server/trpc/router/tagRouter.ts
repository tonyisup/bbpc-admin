import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const tagRouter = router({
  // Tag model
  getTags: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  addTag: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tag.create({
        data: input,
      });
    }),

  updateTag: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.tag.update({
        where: { id },
        data,
      });
    }),

  removeTag: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tag.delete({
        where: { id: input.id },
      });
    }),

  // TagVote model
  getTagVotes: publicProcedure
    .input(z.object({
      tmdbId: z.number().optional(),
      take: z.number().optional().default(100),
      skip: z.number().optional().default(0)
    }))
    .query(async ({ ctx, input }) => {
      const where = input.tmdbId ? { tmdbId: input.tmdbId } : {};
      return await ctx.prisma.tagVote.findMany({
        where,
        take: input.take,
        skip: input.skip,
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  removeTagVote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tagVote.delete({
        where: { id: input.id },
      });
    }),
});
