import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";


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
					Show: true,
					User: true,
					Rating: true,
				}
			})
		}),
	add: protectedProcedure
		.input(z.object({
			userId: z.string(),
			movieId: z.string().optional(),
			showId: z.string().optional(),
			episodeId: z.string(),
			ratingId: z.string().optional(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				data: {
					userId: req.input.userId,
					movieId: req.input.movieId,
					showId: req.input.showId,
					ratingId: req.input.ratingId,
					ExtraReviews: {
						create: {
							episodeId: req.input.episodeId
						}
					}
				}
			})
		}),
	addToAssignment: protectedProcedure
		.input(z.object({
			assignmentId: z.string(),
			userId: z.string(),
			movieId: z.string(),
			ratingId: z.string().optional(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.create({
				include: {
					AssignmentReviews: true
				},
				data: {
					userId: req.input.userId,
					movieId: req.input.movieId,
					ratingId: req.input.ratingId,
					AssignmentReviews: {
						create: {
							assignmentId: req.input.assignmentId
						}
					}
				}
			})
		}),

	remove: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			return await req.ctx.prisma.review.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	removeAssignment: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			return await req.ctx.prisma.assignmentReview.delete({
				where: {
					id: req.input.id
				},
				include: {
					Review: true,
					Guesses: true
				}
			})
		}),
	getExtrasForEpisode: publicProcedure
		.input(z.object({ episodeId: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.review.findMany({
				where: {
					ExtraReviews: {
						some: {
							episodeId: req.input.episodeId
						}
					}
				},
				include: {
					Movie: true,
					Show: true,
					User: true,
				}
			})
		}),
	getForAssignment: protectedProcedure
		.input(z.object({ assignmentId: z.string() }))
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
					Guesses: {
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
			return await req.ctx.prisma.rating.findMany({ orderBy: { value: 'desc' } })
		}),
	setReviewRating: protectedProcedure
		.input(z.object({ reviewId: z.string(), ratingId: z.string().nullish() }))
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
});