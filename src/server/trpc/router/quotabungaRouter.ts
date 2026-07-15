import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { router, adminProcedure } from "../trpc";
import { getCurrentSeasonID } from "../utils/points";

const sourceTypeSchema = z.enum(["MOVIE", "TV", "OTHER"]);
const statusSchema = z.enum(["SUBMITTED", "INCLUDED", "REJECTED"]);

const clipUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Clip URL must be a valid http or https URL");

const contentSchema = z.object({
  quoteText: z.string().trim().min(1).max(2000),
  sourceTitle: z.string().trim().min(1).max(500),
  sourceType: sourceTypeSchema,
  clipUrl: clipUrlSchema.optional().default(""),
  clipStartSeconds: z.number().int().min(0).max(86400).nullable().optional(),
  listenerNotes: z.string().trim().max(1000).optional().default(""),
});

const placementPoints: Record<number, number> = { 1: 40, 2: 20, 3: 10 };
const placementNames: Record<number, string> = { 1: "First", 2: "Second", 3: "Third" };

export const quotabungaRouter = router({
  getEpisodes: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.episode.findMany({
      where: {
        OR: [
          { status: { in: ["next", "recording"] } },
          { quoteSubmissions: { some: {} } },
        ],
      },
      orderBy: { number: "desc" },
      take: 100,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        _count: { select: { quoteSubmissions: true } },
      },
    });
  }),

  list: adminProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.quoteSubmission.findMany({
        where: { episodeId: input.episodeId },
        orderBy: [{ bracketOrder: "asc" }, { createdAt: "asc" }],
        include: {
          episode: { select: { id: true, number: true, title: true, status: true } },
          season: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true, image: true } },
          point: { select: { id: true, adjustment: true, reason: true } },
        },
      });
    }),

  createForUser: adminProcedure
    .input(contentSchema.extend({ episodeId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const episode = await ctx.prisma.episode.findUnique({
        where: { id: input.episodeId },
        select: { id: true, status: true },
      });
      if (!episode) throw new TRPCError({ code: "NOT_FOUND", message: "Episode not found." });

      const existingSubmission = await ctx.prisma.quoteSubmission.findUnique({
        where: {
          episodeId_userId: {
            episodeId: episode.id,
            userId: input.userId,
          },
        },
        select: { id: true },
      });
      if (existingSubmission) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That listener already has a Quotabunga entry for this episode.",
        });
      }

      const existingSeason = await ctx.prisma.quoteSubmission.findFirst({
        where: { episodeId: episode.id },
        select: { seasonId: true },
      });
      const seasonId = existingSeason?.seasonId ?? await getCurrentSeasonID(ctx.prisma);
      if (!seasonId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No active season was found." });
      }

      return ctx.prisma.quoteSubmission.create({
        data: {
          episodeId: episode.id,
          seasonId,
          userId: input.userId,
          quoteText: input.quoteText,
          sourceTitle: input.sourceTitle,
          sourceType: input.sourceType,
          clipUrl: input.clipUrl || null,
          clipStartSeconds: input.clipStartSeconds ?? null,
          listenerNotes: input.listenerNotes || null,
        },
      });
    }),

  update: adminProcedure
    .input(contentSchema.extend({
      id: z.string(),
      adminNotes: z.string().trim().max(1000).optional().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.quoteSubmission.findUnique({
        where: { id: input.id },
        select: { pointId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      if (submission.pointId) {
        throw new TRPCError({ code: "CONFLICT", message: "Scored submissions cannot be edited." });
      }

      return ctx.prisma.quoteSubmission.update({
        where: { id: input.id },
        data: {
          quoteText: input.quoteText,
          sourceTitle: input.sourceTitle,
          sourceType: input.sourceType,
          clipUrl: input.clipUrl || null,
          clipStartSeconds: input.clipStartSeconds ?? null,
          listenerNotes: input.listenerNotes || null,
          adminNotes: input.adminNotes || null,
        },
      });
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.string(), status: statusSchema }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.quoteSubmission.findUnique({
        where: { id: input.id },
        select: { pointId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      if (submission.pointId && input.status !== "INCLUDED") {
        throw new TRPCError({ code: "CONFLICT", message: "Clear the scored result before excluding this entry." });
      }

      return ctx.prisma.quoteSubmission.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "INCLUDED" ? {} : { bracketOrder: null, placement: null }),
        },
      });
    }),

  randomize: adminProcedure
    .input(z.object({ episodeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const submissions = await ctx.prisma.quoteSubmission.findMany({
        where: { episodeId: input.episodeId, status: "INCLUDED" },
        select: { id: true },
      });

      for (let index = submissions.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const current = submissions[index];
        const replacement = submissions[swapIndex];
        if (!current || !replacement) continue;
        submissions[index] = replacement;
        submissions[swapIndex] = current;
      }

      await ctx.prisma.$transaction(
        submissions.map((submission, index) => ctx.prisma.quoteSubmission.update({
          where: { id: submission.id },
          data: { bracketOrder: index + 1 },
        }))
      );

      return { count: submissions.length };
    }),

  awardPlacements: adminProcedure
    .input(z.object({
      episodeId: z.string(),
      placements: z.array(z.object({
        submissionId: z.string(),
        placement: z.number().int().min(1).max(3),
      })).max(3),
    }).superRefine((value, context) => {
      const submissionIds = value.placements.map((item) => item.submissionId);
      const placements = value.placements.map((item) => item.placement);
      if (new Set(submissionIds).size !== submissionIds.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Each submission can have only one placement." });
      }
      if (new Set(placements).size !== placements.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Each placement can be awarded only once." });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const submissions = await tx.quoteSubmission.findMany({
          where: { episodeId: input.episodeId },
          include: { episode: { select: { number: true } } },
        });
        const byId = new Map(submissions.map((submission) => [submission.id, submission]));

        for (const result of input.placements) {
          const submission = byId.get(result.submissionId);
          if (!submission || submission.status !== "INCLUDED") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Only included entries can receive a placement." });
          }
        }

        const awardedIds = new Set(input.placements.map((result) => result.submissionId));

        for (const submission of submissions) {
          if (!awardedIds.has(submission.id) && (submission.pointId || submission.placement)) {
            await tx.quoteSubmission.update({
              where: { id: submission.id },
              data: { pointId: null, placement: null },
            });
            if (submission.pointId) await tx.point.delete({ where: { id: submission.pointId } });
          }
        }

        for (const result of input.placements) {
          const submission = byId.get(result.submissionId);
          const adjustment = placementPoints[result.placement];
          const placementName = placementNames[result.placement];
          if (!submission || adjustment === undefined || !placementName) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Quotabunga result." });
          }
          const reason = `Quotabunga - Episode ${submission.episode.number} - ${placementName} place`;

          let pointId = submission.pointId;
          if (pointId) {
            await tx.point.update({
              where: { id: pointId },
              data: {
                userId: submission.userId,
                seasonId: submission.seasonId,
                adjustment,
                reason,
              },
            });
          } else {
            const point = await tx.point.create({
              data: {
                userId: submission.userId,
                seasonId: submission.seasonId,
                adjustment,
                reason,
                earnedOn: new Date(),
              },
            });
            pointId = point.id;
          }

          await tx.quoteSubmission.update({
            where: { id: submission.id },
            data: { placement: result.placement, pointId },
          });
        }

        return { awarded: input.placements.length };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.quoteSubmission.findUnique({
        where: { id: input.id },
        select: { pointId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });

      return ctx.prisma.$transaction(async (tx) => {
        if (submission.pointId) {
          await tx.quoteSubmission.update({ where: { id: input.id }, data: { pointId: null } });
          await tx.point.delete({ where: { id: submission.pointId } });
        }
        return tx.quoteSubmission.delete({ where: { id: input.id } });
      });
    }),
});
