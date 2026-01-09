import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";
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
      assignmentId: z.string().optional(),
      targetUserId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, seasonId, points, assignmentId, targetUserId } = input;

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
        if (assignmentId) {
          const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { episode: true },
          });

          if (
            assignment?.episode?.status === "recording" ||
            assignment?.episode?.status === "published"
          ) {
            throw new Error("Bets are locked for this episode");
          }
        }

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
            assignmentId,
            targetUserId: input.targetUserId,
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

  getForAssignment: publicProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.gamblingPoints.findMany({
        where: {
          assignmentId: req.input.assignmentId
        },
        include: {
          user: true,
          gamblingType: true,
          targetUser: true,
          point: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    }),

  getUserAssignmentGamblePoints: publicProcedure
    .input(z.object({
      userId: z.string(),
      assignmentId: z.string()
    }))
    .query(async (req) => {
      return await req.ctx.prisma.gamblingPoints.findMany({
        include: {
          gamblingType: true,
          targetUser: true,
        },
        where: {
          userId: req.input.userId,
          assignmentId: req.input.assignmentId
        }
      });
    }),

  confirmGamble: publicProcedure
    .input(z.object({
      gambleId: z.string(),
      seasonId: z.string().optional(), // Fallback
    }))
    .mutation(async ({ ctx, input }) => {
      const gamble = await ctx.prisma.gamblingPoints.findUnique({
        where: { id: input.gambleId },
        include: { gamblingType: true }
      });

      if (!gamble || !gamble.gamblingType) throw new Error("Gamble not found");
      if (gamble.pointsId) throw new Error("Gamble already confirmed");

      let seasonId = gamble.seasonId || input.seasonId;
      if (!seasonId) {
        const currentSeason = await ctx.prisma.season.findFirst({
          orderBy: { startedOn: 'desc' },
          where: { endedOn: null }
        });
        seasonId = currentSeason?.id;
      }

      if (!seasonId) throw new Error("No season found for point creation");

      const gamblingType = gamble.gamblingType;
      const earnedPoints = Math.floor(gamble.points * gamblingType.multiplier);

      return await ctx.prisma.$transaction(async (tx) => {
        const point = await tx.point.create({
          data: {
            userId: gamble.userId,
            seasonId: seasonId!,
            adjustment: earnedPoints,
            reason: `Gamble win: ${gamblingType.title}`,
            earnedOn: new Date(),
          }
        });

        return await tx.gamblingPoints.update({
          where: { id: gamble.id },
          data: {
            successful: true,
            pointsId: point.id,
            seasonId: seasonId // Update the gamble record too if it was missing
          }
        });
      });
    }),

  rejectGamble: publicProcedure
    .input(z.object({
      gambleId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.gamblingPoints.update({
        where: { id: input.gambleId },
        data: {
          successful: false,
          pointsId: null // Ensure no point is linked if rejected
        }
      });
    }),

  // GamblingType Management
  getAllTypes: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.gamblingType.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }),

  createType: adminProcedure
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

  updateType: adminProcedure
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

  deleteType: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.gamblingType.delete({
        where: { id: input.id }
      });
    }),
});