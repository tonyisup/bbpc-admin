import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { calculateUserPoints } from "../utils/points";

export const userRouter = router({
  add: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.create({
        data: {
          name: req.input.name,
          email: req.input.email,
        }
      })
    }),
  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.update({
        where: {
          id: req.input.id
        },
        data: {
          name: req.input.name,
          email: req.input.email,
        }
      })
    }),
  addRole: publicProcedure
    .input(z.object({
      userId: z.string(),
      roleId: z.number(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.userRole.create({
        data: {
          userId: req.input.userId,
          roleId: req.input.roleId,
        }
      })
    }),
  removeRole: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.userRole.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  get: publicProcedure
    .input(z.object({ id: z.string().optional() }))
    .query(async (req) => {
      if (!req.input.id) {
        return;
      }
      return await req.ctx.prisma.user.findUnique({
        where: {
          id: req.input.id
        },
        include: {
          UserRoles: {
            include: {
              Role: true
            }
          }
        }
      })
    }),
  getRoles: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.userRole.findMany({
        where: {
          userId: req.input.id
        },
        include: {
          Role: true
        }
      })
    }),
  getTotalPointsForSeason: publicProcedure
    .input(z.object({
      userId: z.string(),
      seasonId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;
      let seasonId = input.seasonId ?? '';

      if (!seasonId) {
        const season = await ctx.prisma.season.findFirst({
          orderBy: {
            startedOn: 'desc',
          },
          where: {
            endedOn: null,
          },
        });
        seasonId = season?.id ?? '';
      }
      if (!seasonId) {
        return 0;
      }
      return await calculateUserPoints(ctx.prisma, userId, seasonId);
    }),
  getPoints: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.point.findMany({
        where: {
          userId: req.input.id,
        },
        include: {
          Season: true,
          GamePointType: true,
          Guess: {
            include: {
              AssignmentReview: {
                include: {
                  Assignment: {
                    include: {
                      Episode: true,
                      Movie: true,
                    }
                  }
                }
              }
            }
          },
          GamblingPoints: {
            include: {
              Assignment: {
                include: {
                  Episode: true,
                  Movie: true,
                }
              }
            }
          },
          assignmentPoints: {
            include: {
              Assignment: {
                include: {
                  Episode: true,
                  Movie: true,
                }
              }
            }
          },
        },
        orderBy: {
          earnedOn: "desc",
        },
      });
    }),
  addPoint: protectedProcedure
    .input(z.object({
      userId: z.string(),
      seasonId: z.string(),
      value: z.number(),
      reason: z.string(),
      gamePointTypeId: z.number().optional(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.point.create({
        data: {
          userId: req.input.userId,
          seasonId: req.input.seasonId,
          adjustment: req.input.value,
          reason: req.input.reason,
          earnedOn: new Date(),
          gamePointTypeId: req.input.gamePointTypeId,
        }
      })
    }),
  removePoint: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
      /* remove gambling points */
      if (await req.ctx.prisma.gamblingPoints.findFirst({
        where: {
          pointsId: req.input.id
        }
      })) {
        await req.ctx.prisma.gamblingPoints.updateMany({
          where: {
            pointsId: req.input.id
          },
          data: {
            pointsId: null
          }
        })
      }
      /* remove guess point */
      if (await req.ctx.prisma.guess.findFirst({
        where: {
          pointsId: req.input.id
        }
      })) {
        await req.ctx.prisma.guess.updateMany({
          where: {
            pointsId: req.input.id
          },
          data: {
            pointsId: null
          }
        })
      }
      /* remove point */
      return await req.ctx.prisma.point.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.user.count();
    }),
  getSyllabus: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.syllabus.findMany({
        where: {
          userId: req.input.id
        },
        include: {
          Movie: true,
          Assignment: {
            include: {
              Episode: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      });
    }),
  getAdmins: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.user.findMany({
        where: {
          UserRoles: {
            some: {
              Role: {
                admin: true
              }
            }
          }
        }
      });
    }),
});
