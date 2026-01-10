import { z } from "zod";
import { GamePointLookup } from "../../../utils/enums";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getCurrentSeasonID } from "../utils/points";

export const guessRouter = router({
	addOrUpdateGuessesForUser: protectedProcedure
		.input(z.object({
			assignmentId: z.string(),
			userId: z.string(),
			guesses: z.array(z.object({
				adminId: z.string(),
				ratingId: z.string(),
			})),
		}))
		.mutation(async ({ ctx, input }) => {
			const { assignmentId, userId, guesses } = input;

			// Check if user is an admin
			const userRoles = await ctx.prisma.userRole.findMany({
				where: { userId: ctx.session.user.id },
				include: { role: true },
			});
			const isAdmin = userRoles.some(userRole => userRole.role.admin);
			if (!isAdmin) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			// 1. Get current season
			const latestSeasonId = await getCurrentSeasonID(ctx.prisma);
			const latestSeason = latestSeasonId ? await ctx.prisma.season.findUnique({ where: { id: latestSeasonId } }) : null;

			if (!latestSeason) {
				throw new Error("No active season found");
			}

			// 2. Get the assignment to find the movieId
			const assignment = await ctx.prisma.assignment.findUnique({
				where: { id: assignmentId },
				select: { movieId: true },
			});

			if (!assignment) {
				throw new Error("Assignment not found");
			}
			const { movieId } = assignment;

			// 3. Use a transaction to update all guesses at once
			return await ctx.prisma.$transaction(async (prisma) => {
				const results = [];

				for (const guess of guesses) {
					const { adminId, ratingId } = guess;

					// Find the AssignmentReview for the admin's rating on this assignment.
					const assignmentReview = await prisma.assignmentReview.findFirst({
						where: {
							assignmentId: assignmentId,
							review: {
								userId: adminId,
								movieId: movieId,
							},
						},
					});

					if (!assignmentReview) {
						// If there's no review from the admin for this movie on this assignment, we can't add a guess.
						// This is an exceptional case, so we throw an error.
						throw new Error(`Could not find review by admin ${adminId} for this assignment.`);
					}

					// Find if a guess already exists for this user and assignment review
					const existingGuess = await prisma.guess.findFirst({
						where: {
							userId: userId,
							assignmntReviewId: assignmentReview.id,
						},
					});

					if (existingGuess) {
						// Update existing guess
						const updatedGuess = await prisma.guess.update({
							where: { id: existingGuess.id },
							data: { ratingId: ratingId },
						});
						results.push(updatedGuess);
					} else {
						// Create new guess
						const newGuess = await prisma.guess.create({
							data: {
								userId: userId,
								assignmntReviewId: assignmentReview.id,
								ratingId: ratingId,
								seasonId: latestSeason.id,
								created: new Date(),
							},
						});
						results.push(newGuess);
					}
				}
				return results;
			});
		}),
	add: publicProcedure
		.input(z.object({
			userId: z.string(),
			assignmentReviewId: z.string(),
			ratingId: z.string(),
			seasonId: z.string()
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.guess.create({
				data: {
					created: new Date(),
					userId: req.input.userId,
					assignmntReviewId: req.input.assignmentReviewId,
					ratingId: req.input.ratingId,
					seasonId: req.input.seasonId
				}
			})
		}),

	remove: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			return await req.ctx.prisma.guess.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	get: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.guess.findUnique({
				where: {
					id: req.input.id
				}
			})
		}),
	update: publicProcedure
		.input(z.object({
			id: z.string(),
			ratingId: z.string()
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.guess.update({
				where: {
					id: req.input.id
				},
				data: {
					ratingId: req.input.ratingId
				}
			})
		}),
	setPointForGuess: publicProcedure
		.input(z.object({
			id: z.string(),
			gamePointId: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.guess.update({
				where: {
					id: req.input.id
				},
				data: {
					pointsId: req.input.gamePointId
				}
			})
		}),
	getForAssignment: publicProcedure
		.input(z.object({ assignmentId: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.guess.findMany({
				include: {
					user: true,
					rating: true
				},
				where: {
					assignmentReview: {
						is: {
							assignment: {
								is: {
									id: req.input.assignmentId
								}
							}
						}
					}
				}
			})
		}),
	getForEpisode: publicProcedure
		.input(z.object({ episodeId: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.guess.findMany({
				where: {
					assignmentReview: {
						is: {
							assignment: {
								is: {
									episode: {
										is: {
											id: req.input.episodeId
										}
									}
								}
							}
						}
					}
				}
			})
		}),

	getForUser: publicProcedure
		.input(z.object({
			userId: z.string(),
			seasonId: z.string().optional()
		}))
		.query(async (req) => {
			let seasonId = req.input.seasonId;
			const isAll = seasonId === "all";

			if (!seasonId && !isAll) {
				const currentSeasonId = await getCurrentSeasonID(req.ctx.prisma);
				seasonId = currentSeasonId ?? undefined;
			}

			const filterBySeasonId = isAll ? undefined : seasonId;

			const where: any = {
				userId: req.input.userId,
			};

			if (filterBySeasonId) {
				where.seasonId = filterBySeasonId;
			}

			return await req.ctx.prisma.guess.findMany({
				where,
				include: {
					assignmentReview: {
						include: {
							review: {
								include: {
									rating: true
								}
							},
							assignment: {
								include: {
									episode: true,
									movie: true
								}
							}
						}
					},
					point: {
						include: {
							gamePointType: true
						}
					}
				}
			})
		}),
	getAll: publicProcedure
		.query(async (req) => {
			return await req.ctx.prisma.guess.findMany();
		}),
	seasons: publicProcedure
		.query(async (req) => {
			return await req.ctx.prisma.season.findMany()
		}),

	currentSeason: publicProcedure
		.query(async ({ ctx }) => {
			const now = new Date();
			return await ctx.prisma.season.findFirst({
				orderBy: {
					startedOn: 'desc',
				},
				where: {
					startedOn: { lte: now },
					OR: [
						{ endedOn: { gte: now } },
						{ endedOn: null },
					],
				},
				include: {
					gameType: true
				}
			})
		}),

	/* we should always create a new season when we end the current season */
	endSeason: publicProcedure
		.input(z.object({
			endedSeasonId: z.string(),
			newSeasonTitle: z.string(),
			newSeasonDescription: z.string(),
			newSeasonGameTypeId: z.number()
		}))
		.mutation(async (req) => {
			await req.ctx.prisma.season.update({
				where: { id: req.input.endedSeasonId },
				data: { endedOn: new Date() }
			})

			/* create new season */
			return await req.ctx.prisma.season.create({
				data: {
					title: req.input.newSeasonTitle,
					description: req.input.newSeasonDescription,
					gameTypeId: req.input.newSeasonGameTypeId,
					startedOn: new Date()
				}
			})
		}),

	addPointForGuess: publicProcedure
		.input(z.object({
			userId: z.string(),
			seasonId: z.string(),
			id: z.string(),
			adjustment: z.number(),
			reason: z.string(),
			gamePointId: z.number().optional(),
		}))
		.mutation(async (req) => {
			if (!req.input.gamePointId) {
				const gamePoint = await req.ctx.prisma.gamePointType.findFirst({
					where: {
						lookupID: GamePointLookup.GUESS,
					}
				})
				if (!gamePoint) {
					throw new Error('Game point not found');
				}
				req.input.gamePointId = gamePoint.id;
			}
			return await req.ctx.prisma.point.create({
				data: {
					userId: req.input.userId,
					seasonId: req.input.seasonId,
					adjustment: req.input.adjustment,
					reason: req.input.reason,
					gamePointTypeId: req.input.gamePointId,
					earnedOn: new Date(),
					guesses: {
						connect: {
							id: req.input.id
						}
					}
				}
			})
		}),

})