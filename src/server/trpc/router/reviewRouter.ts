import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const reviewRouter = router({
	add: publicProcedure
		.input(z.object({
			userId: z.string(),
			movieId: z.string(),
			ratingId: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				data: {
					userId: req.input.userId,
					movieId: req.input.movieId,
					ratingId: req.input.ratingId,
				}
			})
		}),
	addToAssignment: publicProcedure
		.input(z.object({
			assignmentId: z.string(),
			userId: z.string(),
			movieId: z.string(),
			ratingId: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				include: {
					assignmentReviews: true
				},
				data: {
					userId: req.input.userId,
					movieId: req.input.movieId,
					ratingId: req.input.ratingId,
					assignmentReviews: {
						create: {
							assignmentId: req.input.assignmentId
						}
					}
				}
			})
		}),

	remove: publicProcedure
		.input(z.object({ id: z.string() }))
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
				include: {
					movie: true,
					User: true,
					extraReviews: {
						where: {
							episodeId: req.input.episodeId
						},
					},
					assignmentReviews: {
						where: {
							Assignment: {
								is: {
									Episode: {
										is: {
											id: req.input.episodeId
										}
									}
								}
							}
						},
					}
				}
			})
		}),
	getForAssignment: publicProcedure
		.input(z.object({assignmentId: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.review.findMany({
				where: {
					assignmentReviews: {
						some: {
							assignmentId: req.input.assignmentId
						}
					}
				},
				include: {
					movie: true,
					User: true,
					Rating: true,
				}
			})
		}),
	getRatings: publicProcedure
		.query(async (req) => {
			return await req.ctx.prisma.rating.findMany()
		}),
})