import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";

export const pointRouter = router({
	get: adminProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.prisma.point.findUnique({
				where: { id: input.id },
				include: {
					user: true,
					season: true,
					gamePointType: true,
					assignmentPoints: {
						include: {
							assignment: {
								include: {
									episode: true,
									movie: true,
								}
							}
						}
					},
					gamblingPoints: {
						include: {
							assignment: {
								include: {
									episode: true,
									movie: true,
								}
							},
							gamblingType: true,
						}
					},
					guesses: {
						include: {
							assignmentReview: {
								include: {
									assignment: {
										include: {
											episode: true,
											movie: true,
										}
									}
								}
							}
						}
					},
					tagVotes: true,
				},
			});
		}),

	update: adminProcedure
		.input(z.object({
			id: z.string(),
			reason: z.string().optional(),
			adjustment: z.number().optional(),
			gamePointTypeId: z.number().nullable().optional(),
			earnedOn: z.date().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return await ctx.prisma.point.update({
				where: { id },
				data,
			});
		}),

	remove: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Handle relations that might block deletion depends on schema
			// In this schema, many relations use NoAction or Cascade.
			// We should probably check if we need to nullify pointId in other models

			// Point relations:
			// assignmentPoints: onDelete: NoAction (usually)
			// gamblingPoints: onDelete: NoAction
			// guesses: onDelete: NoAction
			// tagVotes: onDelete: NoAction

			return await ctx.prisma.$transaction(async (tx) => {
				// Nullify foreign keys in related tables
				await tx.assignmentPoints.deleteMany({ where: { pointsId: input.id } });
				await tx.gamblingPoints.updateMany({
					where: { pointsId: input.id },
					data: { pointsId: null }
				});
				await tx.guess.updateMany({
					where: { pointsId: input.id },
					data: { pointsId: null }
				});
				await tx.tagVote.updateMany({
					where: { pointId: input.id },
					data: { pointId: null }
				});

				return await tx.point.delete({
					where: { id: input.id },
				});
			});
		}),
});
