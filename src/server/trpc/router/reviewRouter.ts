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
					movie: true,
					show: true,
					user: true,
					rating: true,
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
					extraReviews: {
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
					review: true,
					guesses: true
				}
			})
		}),
	getExtrasForEpisode: publicProcedure
		.input(z.object({ episodeId: z.string() }))
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
					movie: true,
					show: true,
					user: true,
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
					review: {
						include: {
							movie: true,
							user: true,
							rating: true,
						}
					},
					guesses: {
						include: {
							user: true,
							rating: true,
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
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.prisma.review.findMany({
			include: {
				movie: true,
				show: true,
				user: true,
				rating: true,
				assignmentReviews: {
					include: {
						assignment: {
							include: {
								episode: true,
							},
						},
					},
				},
				extraReviews: {
					include: {
						episode: true,
					},
				},
			},
			orderBy: {
				ReviewdOn: "desc",
			},
		});
	}),
});