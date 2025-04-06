import { z } from "zod";
import { publicProcedure, router } from "../trpc";

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
    .input(z.object({ userId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.gamblingPoints.findMany({
        where: {
          userId: req.input.userId
        },
        include: {
          Assignment: true
        }
      });
    }),
  
  add: publicProcedure
    .input(z.object({
      userId: z.string(),
      assignmentId: z.string(),
      points: z.number()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.gamblingPoints.create({
        data: {
          userId: req.input.userId,
          assignmentId: req.input.assignmentId,
          points: req.input.points
        }
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
    })
}); 