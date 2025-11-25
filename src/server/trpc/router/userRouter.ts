import { z } from "zod";

import { router, publicProcedure, protectedProcedure } from "../trpc";

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
      points: z.number().optional(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.update({
        where: {
          id: req.input.id
        },
        data: {
          name: req.input.name,
          email: req.input.email,
          points: req.input.points,
        }
      })
    }),
  updatePoints: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        points: z.number(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          points: input.points,
        },
      });
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
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.user.findUnique({
        where: {
          id: req.input.id
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
          role: true
        }
      })
    }),
  getPoints: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.point.findMany({
        where: {
          userId: req.input.id
        },
        include: {
          Season: true
        },
        orderBy: {
          earnedOn: 'desc'
        }
      })
    }),
  addPoint: protectedProcedure
    .input(z.object({
      userId: z.string(),
      seasonId: z.string(),
      value: z.number(),
      reason: z.string(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.point.create({
        data: {
          userId: req.input.userId,
          seasonId: req.input.seasonId,
          value: req.input.value,
          reason: req.input.reason,
          earnedOn: new Date(),
        }
      })
    }),
  removePoint: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
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
          roles: {
            some: {
              role: {
                admin: true
              }
            }
          }
        }
      });
    }),
});
