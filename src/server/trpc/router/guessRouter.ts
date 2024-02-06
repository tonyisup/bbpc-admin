import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const guessRouter = router({
  add: publicProcedure
    .input(z.object({
			points: z.number(),
      userId: z.string(),
      assignmentReviewId: z.string(),
			ratingId: z.string(),
			seasonId: z.string()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.guess.create({
        data: {
					points: req.input.points,
					created: new Date(),
          userId: req.input.userId,
          assignmntReviewId: req.input.assignmentReviewId,
					ratingId: req.input.ratingId,
					seasonId: req.input.seasonId
        }
      })
    }),
		
  remove: publicProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.guess.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  get: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.guess.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
	getForAssignment: publicProcedure
		.input(z.object({assignmentId: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.guess.findMany({
				include: {
					User: true,
					Rating: true
				},
				where: {
					AssignmentReview: {
						is: {
							Assignment: {
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
    .input(z.object({episodeId: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.guess.findMany({
				where: {
					AssignmentReview: {
						is: {
							Assignment: {
								is: {
									Episode: {
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
  getAll: publicProcedure
    .query(async (req) => {
      return await req.ctx.prisma.guess.findMany();
    }),
	seasons: publicProcedure
		.query(async (req) => {
			return await req.ctx.prisma.season.findMany()
		}),
})