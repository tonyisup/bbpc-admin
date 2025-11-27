import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { calculateUserPoints } from "../utils/points";

export const gamblingRouter = router({
  getForAssignment: publicProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.gamblingPoints.findMany({
        where: {
          assignmentId: req.input.assignmentId
        },
        include: {
          User: true
        }
      });
    }),
  
  getForUser: publicProcedure
    .input(z.object({ 
      userId: z.string(),
      seasonId: z.string().optional()
     }))
    .query(async (req) => {
      let seasonId = req.input.seasonId ?? '';
      if (!seasonId) {
        const season = await req.ctx.prisma.season.findFirst({
          orderBy: {
            startedOn: 'desc',
          },
          where: { endedOn: null }
        });
        seasonId = season?.id ?? '';
      }
      return await req.ctx.prisma.gamblingPoints.findMany({
        where: {
          userId: req.input.userId,
          seasonId: seasonId
        },
        include: {
          Assignment: {
            include: {
              Episode: true,
              Movie: true
            }
          },
          Point: true
        }
      });
    }),
  
  add: publicProcedure
    .input(z.object({
      userId: z.string(),
      assignmentId: z.string(),
      points: z.number(),
      seasonId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, seasonId, points, assignmentId } = input;

      return await ctx.prisma.$transaction(async (prisma) => {
        const userTotalPoints = await calculateUserPoints(prisma, userId, seasonId);

        if (userTotalPoints < points) {
          throw new Error("Not enough points to gamble");
        }

        const newGamble = await prisma.gamblingPoints.create({
          data: {
            userId,
            assignmentId,
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
          value: req.input.points,
          reason: req.input.reason,
          earnedOn: new Date(),
          GamblingPoints: {
            connect: {
              id: req.input.id
            }
          }
        }
      });
    }),
}); 