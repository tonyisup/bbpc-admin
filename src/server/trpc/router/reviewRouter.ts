import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const reviewRouter = router({
	get: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.review.findUnique({
				where: {
					id: req.input.id
				},
				include: {
					Movie: true,
					User: true,
					Rating: true,
				}
			})
		}),
	add: publicProcedure
		.input(z.object({
			userId: z.string(),
			movieId: z.string(),
			episodeId: z.string(),
			ratingId: z.string().optional(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				data: {
					userId: req.input.userId,
					movieId: req.input.movieId,
					ratingId: req.input.ratingId,
					extraReviews: {
						create: {
							episodeId: req.input.episodeId
						}
					}
				}
			})
		}),
	addToAssignment: publicProcedure
		.input(z.object({
			assignmentId: z.string(),
			userId: z.string(),
			movieId: z.string(),
			ratingId: z.string().optional(),
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
	removeAssignment: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			return await req.ctx.prisma.assignmentReview.delete({
				where: {
					id: req.input.id
				},
				include: {
					Review: true,
					guesses: true
				}
			})
		}),
	getExtrasForEpisode: publicProcedure
		.input(z.object({episodeId: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.review.findMany({
				where: {
					extraReviews: {
						some: {
							episodeId: req.input.episodeId
						}
					}
				},
				include: {
					Movie: true,
					User: true,
					extraReviews: {
						where: {
							episodeId: req.input.episodeId
						},
					},
				}
			})
		}),
	getForAssignment: publicProcedure
		.input(z.object({assignmentId: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.assignmentReview.findMany({
				where: {
						assignmentId: req.input.assignmentId
					},
				include: {
					Review: {
						include: {
							Movie: true,
							User: true,
							Rating: true,
						}
					},
					guesses: {
						include: {
							User: true,
							Rating: true,
						}
					}
				}
			})
		}),
	getRatings: publicProcedure
		.query(async (req) => {
			return await req.ctx.prisma.rating.findMany()
		}),
	setReviewRating: publicProcedure
		.input(z.object({reviewId: z.string(), ratingId: z.string().nullish()}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.update({
				where: {
					id: req.input.reviewId
				},
				data: {
					ratingId: req.input.ratingId
				}
			})
		}),
})