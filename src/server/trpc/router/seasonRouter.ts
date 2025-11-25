
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const seasonRouter = router({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.season.findMany();
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.season.findUnique({
        where: { id: input.id },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        gameTypeId: z.number(),
        startedOn: z.date(),
        endedOn: z.date(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.season.create({
        data: {
          title: input.title,
          description: input.description,
          gameTypeId: input.gameTypeId,
          startedOn: input.startedOn,
          endedOn: input.endedOn,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        gameTypeId: z.number(),
        startedOn: z.date(),
        endedOn: z.date(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.season.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          gameTypeId: input.gameTypeId,
          startedOn: input.startedOn,
          endedOn: input.endedOn,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.season.delete({
        where: { id: input.id },
      });
    }),
});
