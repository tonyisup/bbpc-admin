
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const seasonRouter = router({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.season.findMany({
      include: {
        gameType: true,
        _count: {
          select: {
            guesses: true,
            points: true,
          }
        }
      },
      orderBy: {
        startedOn: 'desc',
      },
    });
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.season.findUnique({
        where: { id: input.id },
        include: {
          gameType: true,
          _count: {
            select: {
              guesses: true,
              points: true,
              gamblingPoints: true,
            },
          },
        },
      });
    }),

  // Paginated points for timeline tab
  getPoints: publicProcedure
    .input(z.object({
      seasonId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const points = await ctx.prisma.point.findMany({
        where: { seasonId: input.seasonId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { earnedOn: 'desc' },
        include: {
          user: true,
          gamePointType: true,
          guesses: {
            include: {
              assignmentReview: {
                include: {
                  assignment: {
                    include: {
                      episode: true,
                      movie: true,
                    },
                  },
                },
              },
            },
          },
          assignmentPoints: {
            include: {
              assignment: {
                include: {
                  episode: true,
                  movie: true,
                },
              },
            },
          },
          gamblingPoints: {
            include: {
              gamblingType: true,
              assignment: {
                include: {
                  episode: true,
                  movie: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (points.length > input.limit) {
        const nextItem = points.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: points,
        nextCursor,
      };
    }),

  // Paginated guesses for guesses tab
  getGuesses: publicProcedure
    .input(z.object({
      seasonId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const guesses = await ctx.prisma.guess.findMany({
        where: { seasonId: input.seasonId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { created: 'desc' },
        include: {
          user: true,
          rating: true,
          assignmentReview: {
            include: {
              assignment: {
                include: {
                  movie: true,
                  episode: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (guesses.length > input.limit) {
        const nextItem = guesses.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: guesses,
        nextCursor,
      };
    }),

  // Paginated gambling points for gambling tab
  getGambling: publicProcedure
    .input(z.object({
      seasonId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const gamblingPoints = await ctx.prisma.gamblingPoints.findMany({
        where: { seasonId: input.seasonId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          assignment: {
            include: {
              movie: true,
              episode: true,
            },
          },
          gamblingType: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (gamblingPoints.length > input.limit) {
        const nextItem = gamblingPoints.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: gamblingPoints,
        nextCursor,
      };
    }),

  // Aggregated user summary for leaderboard - much more efficient than loading all points
  getUserSummary: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get all points grouped by user with their totals
      const pointAggregates = await ctx.prisma.point.groupBy({
        by: ['userId'],
        where: { seasonId: input.seasonId },
        _sum: { adjustment: true },
      });

      // Get point type sums per user
      const pointsWithTypes = await ctx.prisma.point.findMany({
        where: { seasonId: input.seasonId },
        select: {
          userId: true,
          adjustment: true,
          gamePointType: { select: { points: true } },
        },
      });

      // Calculate totals including gamePointType.points
      const userTotals: Record<string, number> = {};
      pointsWithTypes.forEach((p) => {
        const gamePointPoints = p.gamePointType?.points ?? 0;
        const adjustment = p.adjustment ?? 0;
        userTotals[p.userId] = (userTotals[p.userId] || 0) + adjustment + gamePointPoints;
      });

      // Get guess counts per user
      const guessCounts = await ctx.prisma.guess.groupBy({
        by: ['userId'],
        where: { seasonId: input.seasonId },
        _count: { _all: true },
      });

      // Get gambling counts per user
      const gamblingCounts = await ctx.prisma.gamblingPoints.groupBy({
        by: ['userId'],
        where: { seasonId: input.seasonId },
        _count: { _all: true },
      });

      // Get user IDs that participated
      const allUserIds = [
        ...new Set([
          ...Object.keys(userTotals),
          ...guessCounts.map(g => g.userId),
          ...gamblingCounts.map(g => g.userId),
        ]),
      ];

      // Fetch user details
      const users = await ctx.prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, image: true },
      });

      const guessCountMap = new Map(guessCounts.map(g => [g.userId, g._count._all]));
      const gamblingCountMap = new Map(gamblingCounts.map(g => [g.userId, g._count._all]));

      const summary = users.map(user => ({
        user,
        total: userTotals[user.id] || 0,
        guessCount: guessCountMap.get(user.id) || 0,
        gamblingCount: gamblingCountMap.get(user.id) || 0,
      })).sort((a, b) => b.total - a.total);

      return summary;
    }),

  // Chart data query - returns aggregated points by date for performance tracking chart
  getChartData: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const points = await ctx.prisma.point.findMany({
        where: { seasonId: input.seasonId },
        orderBy: { earnedOn: 'asc' },
        select: {
          userId: true,
          earnedOn: true,
          adjustment: true,
          gamePointType: { select: { points: true } },
          user: { select: { id: true, name: true } },
        },
      });

      return points;
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        gameTypeId: z.number(),
        startedOn: z.date(),
        endedOn: z.date().nullable().optional(),
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
        endedOn: z.date().nullable(),
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
