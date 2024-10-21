import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { utapi } from "../../../server/uploadthing";


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
	removeAudioMessage: protectedProcedure
		.input(z.object({
			id: z.number(),
		}))
		.mutation(async ({ ctx, input }) => {
			const audioMessage = await ctx.prisma.audioMessage.findUnique({
					where: { id: input.id },
						});
	
				if (!audioMessage) {
					throw new Error("Audio message not found");
				}
	
				if (!audioMessage.fileKey) {
					throw new Error("Audio message not found");
				}
				// Delete from UploadThing
				await utapi.deleteFiles([audioMessage.fileKey]);
	
				// Delete from Prisma database
				await ctx.prisma.audioMessage.delete({
					where: { id: input.id },
				});
	
			return { success: true };
		}),
});