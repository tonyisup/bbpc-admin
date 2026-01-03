import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { calculateUserPoints } from "../utils/points";

export const userRouter = router({
	add: publicProcedure
		.input(z.object({
			name: z.string(),
			email: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.user.create({
				data: {
					name: req.input.name,
					email: req.input.email,
				}
			})
		}),
	remove: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			return await req.ctx.prisma.user.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.user.update({
				where: {
					id: req.input.id
				},
				data: {
					name: req.input.name,
					email: req.input.email,
				}
			})
		}),
	addRole: publicProcedure
		.input(z.object({
			userId: z.string(),
			roleId: z.number(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.userRole.create({
				data: {
					userId: req.input.userId,
					roleId: req.input.roleId,
				}
			})
		}),
	removeRole: publicProcedure
		.input(z.object({
			id: z.string(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.userRole.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	get: publicProcedure
		.input(z.object({ id: z.string().optional() }))
		.query(async (req) => {
			if (!req.input.id) {
				return;
			}
			return await req.ctx.prisma.user.findUnique({
				where: {
					id: req.input.id
				},
				include: {
					roles: {
						include: {
							role: true
						}
					}
				}
			})
		}),
	getRoles: publicProcedure
		.query(async (req) => {
			if (!req.ctx.session?.user) {
				return;
			}
			return await req.ctx.prisma.userRole.findMany({
				where: {
					userId: req.ctx.session?.user.id
				},
				include: {
					role: true
				}
			})
		}),
	getTotalPointsForSeason: publicProcedure
		.input(z.object({
			userId: z.string(),
			seasonId: z.string().optional()
		}))
		.query(async ({ ctx, input }) => {
			const { userId, seasonId } = input;
			// We pass seasonId as is: 
			// undefined -> calculateUserPoints uses current
			// "all" -> we should map this to null in the frontend or here
			return await calculateUserPoints(ctx.prisma, userId, seasonId === "all" ? null : seasonId);
		}),
	getPoints: publicProcedure
		.input(z.object({
			id: z.string(),
			seasonId: z.string().optional()
		}))
		.query(async (req) => {
			let seasonId = req.input.seasonId;
			const isAll = seasonId === "all";

			if (!seasonId && !isAll) {
				const season = await req.ctx.prisma.season.findFirst({
					orderBy: {
						startedOn: 'desc',
					},
					where: {
						endedOn: null,
					},
				});
				seasonId = season?.id;
			}

			const where: any = {
				userId: req.input.id,
			};

			if (seasonId && !isAll) {
				where.seasonId = seasonId;
			}

			return await req.ctx.prisma.point.findMany({
				where,
				include: {
					season: true,
					gamePointType: true,
					guesses: {
						include: {
							assignmentReview: {
								include: {
									assignment: {
										include: {
											episode: {
												select: {
													id: true,
													number: true,
													title: true,
												},
											},
											movie: {
												select: {
													id: true,
													title: true,
												},
											},
										}
									}
								}
							}
						}
					},
					gamblingPoints: {
						include: {
							assignment: {
								include: {
									episode: {
										select: {
											id: true,
											number: true,
											title: true,
										},
									},
									movie: {
										select: {
											id: true,
											title: true,
										},
									},
								}
							}
						}
					},
					assignmentPoints: {
						include: {
							assignment: {
								include: {
									episode: {
										select: {
											id: true,
											number: true,
											title: true,
										},
									},
									movie: {
										select: {
											id: true,
											title: true,
										},
									},
								}
							}
						}
					},
				},
				orderBy: {
					earnedOn: "desc",
				},
			});
		}),
	addPoint: protectedProcedure
		.input(z.object({
			userId: z.string(),
			seasonId: z.string(),
			value: z.number(),
			reason: z.string(),
			gamePointTypeId: z.number().optional(),
		}))
		.mutation(async (req) => {
			return await req.ctx.prisma.point.create({
				data: {
					userId: req.input.userId,
					seasonId: req.input.seasonId,
					adjustment: req.input.value,
					reason: req.input.reason,
					earnedOn: new Date(),
					gamePointTypeId: req.input.gamePointTypeId,
				}
			})
		}),
	removePoint: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async (req) => {
			/* remove gambling points */
			if (await req.ctx.prisma.gamblingPoints.findFirst({
				where: {
					pointsId: req.input.id
				}
			})) {
				await req.ctx.prisma.gamblingPoints.updateMany({
					where: {
						pointsId: req.input.id
					},
					data: {
						pointsId: null
					}
				})
			}
			/* remove guess point */
			if (await req.ctx.prisma.guess.findFirst({
				where: {
					pointsId: req.input.id
				}
			})) {
				await req.ctx.prisma.guess.updateMany({
					where: {
						pointsId: req.input.id
					},
					data: {
						pointsId: null
					}
				})
			}
			/* remove point */
			return await req.ctx.prisma.point.delete({
				where: {
					id: req.input.id
				}
			})
		}),
	getAll: publicProcedure
		.query(({ ctx }) => {
			return ctx.prisma.user.findMany({
				include: {
					roles: {
						include: {
							role: true
						}
					}
				},
				orderBy: {
					name: 'asc'
				}
			});
		}),
	getSummary: publicProcedure
		.query(({ ctx }) => {
			return ctx.prisma.user.count();
		}),
	getSyllabus: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async (req) => {
			return await req.ctx.prisma.syllabus.findMany({
				where: {
					userId: req.input.id
				},
				include: {
					movie: true,
					assignment: {
						include: {
							episode: true
						}
					}
				},
				orderBy: {
					order: 'desc'
				}
			});
		}),
	reorderSyllabus: protectedProcedure
		.input(z.array(z.object({
			id: z.string(),
			order: z.number()
		})))
		.mutation(async ({ ctx, input }) => {
			return await ctx.prisma.$transaction(
				input.map((item) =>
					ctx.prisma.syllabus.update({
						where: { id: item.id },
						data: { order: item.order },
					})
				)
			);
		}),
	getAdmins: publicProcedure
		.query(async ({ ctx }) => {
			return await ctx.prisma.user.findMany({
				where: {
					roles: {
						some: {
							role: {
								admin: true
							}
						}
					}
				}
			});
		}),
});
