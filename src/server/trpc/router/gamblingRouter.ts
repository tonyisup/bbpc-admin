import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { calculateUserPoints } from "../utils/points";

export const gamblingRouter = router({
  getForGamblingType: publicProcedure
    .input(z.object({ gamblingTypeId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.gamblingPoints.findMany({
        where: {
          gamblingTypeId: req.input.gamblingTypeId
        },
        include: {
          user: true
        }
      });
    }),

  getForUser: publicProcedure
    .input(z.object({
      userId: z.string(),
      seasonId: z.string().optional()
    }))
    .query(async (req) => {
      let seasonId = req.input.seasonId;
      const isAll = seasonId === "all";

      if (!seasonId && !isAll) {
        const season = await req.ctx.prisma.season.findFirst({
          orderBy: {
            startedOn: 'desc',
          },
          where: { endedOn: null }
        });
        seasonId = season?.id;
      }

      const filterBySeasonId = isAll ? undefined : seasonId;

      const where: any = {
        userId: req.input.userId,
      };

      if (filterBySeasonId) {
        where.seasonId = filterBySeasonId;
      }

      return await req.ctx.prisma.gamblingPoints.findMany({
        where,
        include: {
          gamblingType: true,
          point: true
        }
      });
    }),

  add: publicProcedure
    .input(z.object({
      userId: z.string(),
      gamblingTypeId: z.string(),
      points: z.number(),
      seasonId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, seasonId, points, assignmentId } = input;

      if (!seasonId) {
        const season = await ctx.prisma.season.findFirst({
          orderBy: {
            startedOn: 'desc',
          },
          where: { endedOn: null }
        });
        if (!season) {
          throw new Error("No active season found to add gambling points");
        }
        input.seasonId = season.id;
      }

      return await ctx.prisma.$transaction(async (prisma) => {
        const userTotalPoints = await calculateUserPoints(prisma, userId, seasonId);

        if (userTotalPoints < points) {
          throw new Error("Not enough points to gamble");
        }

        const newGamble = await prisma.gamblingPoints.create({
          data: {
            userId,
            gamblingTypeId: input.gamblingTypeId,
            points,
            seasonId,
          },
        });

        return newGamble;
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      points: z.number()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.gamblingPoints.update({
        where: {
          id: req.input.id
        },
        data: {
          points: req.input.points
        }
      });
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.gamblingPoints.delete({
        where: {
          id: req.input.id
        }
      });
    }),

  addPointForGamblingPoint: publicProcedure
    .input(z.object({
      userId: z.string(),
      seasonId: z.string(),
      id: z.string(),
      points: z.number(),
      reason: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.point.create({
        data: {
          userId: req.input.userId,
          seasonId: req.input.seasonId,
          adjustment: req.input.points,
          reason: req.input.reason,
          earnedOn: new Date(),
          gamblingPoints: {
            connect: {
              id: req.input.id
            }
          }
        }
      });
    }),

  // GamblingType Management
  getAllTypes: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.gamblingType.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }),

  createType: publicProcedure
    .input(z.object({
      title: z.string(),
      lookupId: z.string(),
      description: z.string().optional(),
      multiplier: z.number().default(1.5),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.gamblingType.create({
        data: input
      });
    }),

  updateType: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      lookupId: z.string().optional(),
      description: z.string().optional(),
      multiplier: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.gamblingType.update({
        where: { id },
        data
      });
    }),

  deleteType: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.gamblingType.delete({
        where: { id: input.id }
      });
    }),
});