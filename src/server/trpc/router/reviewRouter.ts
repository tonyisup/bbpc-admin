import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const reviewRouter = router({
	add: publicProcedure
		.input(z.object({
			episodeId: z.string(),
			movieId: z.string(),
			userId: z.string()
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				data: {
					episodeId: req.input.episodeId,
					movieId: req.input.movieId,
					userId: req.input.userId
				}
			})
		}),
	remove: publicProcedure
		.input(z.object({id: z.string()}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	getForEpisode: publicProcedure
		.input(z.object({episodeId: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.review.findMany({
				where: {
					episodeId: req.input.episodeId
				},
				include: {
					movie: true,
					User: true
				}
			})
		}),
})