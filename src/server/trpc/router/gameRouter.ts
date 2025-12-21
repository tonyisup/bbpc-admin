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
				req.input.seasonId = await getCurrentSeasonID(req.ctx.prisma);
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
				req.input.seasonId = await getCurrentSeasonID(req.ctx.prisma);
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
					Point: {
						include: {
							GamePointType: true
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
			return points.reduce((acc, point) => acc + (point.Point?.GamePointType?.points ?? 0) + (point.Point?.adjustment ?? 0), 0);
		})
})
