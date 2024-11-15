import { z } from "zod";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { utapi } from "../../uploadthing";

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
	addLink: protectedProcedure
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
  add: protectedProcedure
    .input(z.object({number: z.number(), title: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.create({
        data: {
          number: req.input.number,
          title: req.input.title   
        }
      })
    }),
  remove: protectedProcedure
    .input(z.object({id: z.string()}))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  update: protectedProcedure
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
    getAudioMessages: protectedProcedure
      .input(z.object({episodeId: z.string()}))
      .query(async (req) => {
        return await req.ctx.prisma.audioEpisodeMessage.findMany({
          where: { episodeId: req.input.episodeId },
          include: {
            User: true
          } 
        })
      }),
    removeAudioMessage: protectedProcedure
      .input(z.object({
          id: z.number(),
        }))
        .mutation(async (req) => {
          const audioMessage = await req.ctx.prisma.audioEpisodeMessage.findUnique({
              where: { id: req.input.id },
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
            await req.ctx.prisma.audioEpisodeMessage.delete({
              where: { id: req.input.id },
            });
      
          return { success: true };
        }),
});
