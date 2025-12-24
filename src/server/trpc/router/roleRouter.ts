import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const roleRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.role.findUnique({
        where: { id: input.id },
      });
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }),

  getSummary: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.role.count();
  }),

  add: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        admin: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.role.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        description: z.string(),
        admin: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.role.update({
        where: { id },
        data,
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.role.delete({
        where: { id: input.id },
      });
    }),
});
