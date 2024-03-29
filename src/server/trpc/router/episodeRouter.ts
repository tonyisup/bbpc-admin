import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const episodeRouter = router({
	getLinks: publicProcedure
		.input(z.object({id: z.string()}))
		.query(async (req) => {
			return await req.ctx.prisma.episode.findUnique({
				where: {
					id: req.input.id
				},
				select: {
					links: true
				}
			})
		}),
	addLink: publicProcedure
		.input(z.object({episodeId: z.string(), url: z.string(), text: z.string()}))
		.mutation(async (req) => {
			return await req.ctx.prisma.link.create({
				data: {
					Episode: {
						connect: {
							id: req.input.episodeId
						}
					},
					url: req.input.url,
					text: req.input.text
				}
			})
		}),
  getAssigments: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany({
        where: {
          episodeId: req.input.id
        }
      })
    }),
  add: publicProcedure
    .input(z.object({number: z.number(), title: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.create({
        data: {
          number: req.input.number,
          title: req.input.title   
        }
      })
    }),
  remove: publicProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(), 
      number: z.number(), 
      title: z.string(),
      description: z.string(),
      date: z.date().optional(),
      recording: z.string().optional()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.update({
        where: {
          id: req.input.id
        },
        data: {
          number: req.input.number,
          title: req.input.title,
          description: req.input.description,
          date: req.input.date,
          recording: req.input.recording
        }
      })
    }),
  get: publicProcedure
    .input(z.object({id: z.string()}))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
    full: publicProcedure
      .input(z.object({id: z.string()}))
      .query(async (req) => {
        return await req.ctx.prisma.episode.findUnique({
          where: {
            id: req.input.id
          },
          include: {
            assignments: {
              include: {
                User: true,
                Movie: true
              }
            },
            extras: {
              include: {
								Review: {
									include: {
										User: true,
										Movie: true
									}
								}
              }
            }
          }
        })
      }),
  fullByNumber: publicProcedure
    .input(z.object({number: z.number()}))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findFirst({
        where: {
          number: req.input.number
        },
        include: {
          assignments: {
            include: {
              User: true,
              Movie: true
            }
          },
					extras: {
						include: {
							Review: {
								include: {
									User: true,
									Movie: true
								}
							}
						}
					}
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.episode.findMany({
				orderBy: {
					number: 'desc'
				}
			});
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.episode.count();
    }),
});
