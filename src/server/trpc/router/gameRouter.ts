import { publicProcedure, router } from "../trpc";
import { z } from "zod";

export const gameRouter = router({
	getGameTypes: publicProcedure.query(async (req) => {
		return await req.ctx.prisma.gameType.findMany();
	}),

	getGamePointsForGameType: publicProcedure
		.input(z.object({ gameTypeId: z.number() }))
		.query(async (req) => {
			return await req.ctx.prisma.gamePoint.findMany({
				where: {
					gameTypeId: req.input.gameTypeId
				}
			});
		}),
})
