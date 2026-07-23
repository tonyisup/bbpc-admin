import { z } from "zod";
import { adminProcedure, router } from "../trpc";

export const bangerRouter = router({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.banger.findMany({
      include: {
        episode: true,
        user: true,
      },
      orderBy: {
        title: "asc",
      },
    });
  }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.banger.findUnique({
        where: { id: input.id },
        include: {
          episode: true,
          user: true,
        },
      });
    }),

  add: adminProcedure
    .input(
      z.object({
        title: z.string(),
        artist: z.string(),
        url: z.string().url(),
        episodeId: z.string().nullish(),
        userId: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.banger.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        artist: z.string(),
        url: z.string().url(),
        episodeId: z.string().nullish(),
        userId: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.banger.update({
        where: { id },
        data,
      });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.banger.delete({
        where: { id: input.id },
      });
    }),
});
