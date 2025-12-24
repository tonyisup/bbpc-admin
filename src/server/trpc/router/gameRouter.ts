import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { domainDataGamePoints, domainDataGameTypes } from "@/utils/enums";
import { GamePointType, GameType } from "@prisma/client";
import { getCurrentSeasonID } from "../utils/points";

export const gameRouter = router({
	getGameTypes: publicProcedure.query(async (req) => {
		return await req.ctx.prisma.gameType.findMany();
	}),

	getAllGamePointTypes: publicProcedure.query(async (req) => {
		return await req.ctx.prisma.gamePointType.findMany({
			orderBy: {
				title: 'asc'
			}
		});
	}),

	getGamePointsForGameType: publicProcedure
		.input(z.object({ gameTypeId: z.number() }))
		.query(async (req) => {
			return await req.ctx.prisma.gamePointType.findMany({
				where: {
					gameTypeId: req.input.gameTypeId
				}
			});
		}),

	addPointEvent: publicProcedure
		.input(z.object({
			userId: z.string(),
			gamePointLookupId: z.string(),
			reason: z.string(),
			seasonId: z.string().optional(),
			adjustment: z.number().optional(),
		}))
		.mutation(async (req) => {
			const gamePoint = await req.ctx.prisma.gamePointType.findFirst({
				where: {
					lookupID: req.input.gamePointLookupId,
				}
			});
			if (!req.input.seasonId) {
				const currentSeasonId = await getCurrentSeasonID(req.ctx.prisma);
				if (!currentSeasonId) {
					throw new Error("No active season found to add points");
				}
				req.input.seasonId = currentSeasonId;
			}
			const point = await req.ctx.prisma.point.create({
				data: {
					userId: req.input.userId,
					seasonId: req.input.seasonId,
					gamePointTypeId: gamePoint?.id,
					adjustment: req.input.adjustment ?? 0,
					reason: req.input.reason,
					earnedOn: new Date(),
				}
			});

			return {
				...point,
				GamePointType: gamePoint,
			};
		}),

	addAssignmentPointEvent: publicProcedure
		.input(z.object({
			userId: z.string(),
			assignmentId: z.string(),
			gamePointLookupId: z.string(),
			reason: z.string(),
			seasonId: z.string().optional(),
			adjustment: z.number().optional(),
		}))
		.mutation(async (req) => {
			const gamePoint = await req.ctx.prisma.gamePointType.findFirst({
				where: {
					lookupID: req.input.gamePointLookupId,
				}
			});
			if (!req.input.seasonId) {
				const currentSeasonId = await getCurrentSeasonID(req.ctx.prisma);
				if (!currentSeasonId) {
					throw new Error("No active season found to add assignment points");
				}
				req.input.seasonId = currentSeasonId;
			}
			const point = await req.ctx.prisma.point.create({
				data: {
					userId: req.input.userId,
					seasonId: req.input.seasonId,
					gamePointTypeId: gamePoint?.id,
					adjustment: req.input.adjustment ?? 0,
					reason: req.input.reason,
					earnedOn: new Date(),
				}
			});
			const assignmentPoint = await req.ctx.prisma.assignmentPoints.create({
				data: {
					userId: req.input.userId,
					assignmentId: req.input.assignmentId,
					pointsId: point.id,
				}
			});

			return {
				...point,
				GamePointType: gamePoint,
				AssignmentPoint: assignmentPoint,
			};
		}),

	getUserPointTotalForAssignment: publicProcedure
		.input(z.object({
			userId: z.string(),
			assignmentId: z.string()
		}))
		.query(async (req) => {
			const points = await req.ctx.prisma.assignmentPoints.findMany({
				include: {
					point: {
						include: {
							gamePointType: true
						}
					}
				},
				where: {
					userId: req.input.userId,
					assignmentId: req.input.assignmentId
				}
			});
			if (!points) {
				return 0;
			}
			return points.reduce((acc, point) => acc + (point.point?.gamePointType?.points ?? 0) + (point.point?.adjustment ?? 0), 0);
		}),

	getUsersPointTotalsForAssignments: publicProcedure
		.input(z.object({
			userIds: z.array(z.string()),
			assignmentIds: z.array(z.string())
		}))
		.query(async (req) => {
			const points = await req.ctx.prisma.assignmentPoints.findMany({
				include: {
					point: {
						include: {
							gamePointType: true
						}
					}
				},
				where: {
					userId: { in: req.input.userIds },
					assignmentId: { in: req.input.assignmentIds }
				}
			});

			const totals: Record<string, number> = {};
			points.forEach(p => {
				const key = `${p.userId}-${p.assignmentId}`;
				const pointValue = (p.point?.gamePointType?.points ?? 0) + (p.point?.adjustment ?? 0);
				totals[key] = (totals[key] || 0) + pointValue;
			});

			return totals;
		}),

	addGameType: publicProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			lookupID: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			return await ctx.prisma.gameType.create({
				data: input,
			});
		}),

	updateGameType: publicProcedure
		.input(z.object({
			id: z.number(),
			title: z.string(),
			description: z.string().optional(),
			lookupID: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return await ctx.prisma.gameType.update({
				where: { id },
				data,
			});
		}),

	removeGameType: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.prisma.gameType.delete({
				where: { id: input.id },
			});
		}),

	addGamePointType: publicProcedure
		.input(z.object({
			lookupID: z.string(),
			title: z.string(),
			description: z.string().optional(),
			points: z.number(),
			gameTypeId: z.number(),
		}))
		.mutation(async ({ ctx, input }) => {
			return await ctx.prisma.gamePointType.create({
				data: input,
			});
		}),

	updateGamePointType: publicProcedure
		.input(z.object({
			id: z.number(),
			lookupID: z.string(),
			title: z.string(),
			description: z.string().optional(),
			points: z.number(),
			gameTypeId: z.number(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return await ctx.prisma.gamePointType.update({
				where: { id },
				data,
			});
		}),

	removeGamePointType: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.prisma.gamePointType.delete({
				where: { id: input.id },
			});
		}),
})
