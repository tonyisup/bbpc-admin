import { prisma } from "@prisma/client";
import { Input } from "postcss";
import { z } from "zod";

import { router, publicProcedure } from "../trpc";

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
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.user.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: publicProcedure
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
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.user.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  getRoles: publicProcedure
    .input(z.object({id: z.string()}))
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
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.user.count();
    }),
});
