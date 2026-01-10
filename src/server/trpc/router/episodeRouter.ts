import { z } from "zod";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { utapi } from "../../uploadthing";

export const episodeRouter = router({
  getLinks: publicProcedure
    .input(z.object({ id: z.string() }))
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
    .input(z.object({ episodeId: z.string(), url: z.string(), text: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.link.create({
        data: {
          episode: {
            connect: {
              id: req.input.episodeId
            }
          },
          url: req.input.url,
          text: req.input.text
        }
      })
    }),
  removeLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.link.delete({
        where: { id: input.id }
      })
    }),
  getAssigments: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany({
        where: {
          episodeId: req.input.id
        }
      })
    }),
  add: protectedProcedure
    .input(z.object({ number: z.number(), title: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.create({
        data: {
          number: req.input.number,
          title: req.input.title,
          status: "pending"
        }
      })
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
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
      recording: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.$transaction(async (tx) => {
        const episode = await tx.episode.update({
          where: {
            id: req.input.id
          },
          data: {
            number: req.input.number,
            title: req.input.title,
            description: req.input.description,
            date: req.input.date,
            recording: req.input.recording,
            status: req.input.status,
            notes: req.input.notes
          }
        });

        if (req.input.status === "recording" || req.input.status === "published") {
          await tx.gamblingPoints.updateMany({
            where: {
              assignment: {
                episodeId: req.input.id
              },
              status: "pending"
            },
            data: {
              status: "locked"
            }
          });
        }

        return episode;
      });
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findUnique({
        where: {
          id: req.input.id
        }
      })
    }),
  full: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findUnique({
        where: {
          id: req.input.id
        },
        include: {
          assignments: {
            include: {
              user: true,
              movie: true
            }
          },
          extras: {
            include: {
              review: {
                include: {
                  user: true,
                  movie: true
                }
              }
            }
          }
        }
      })
    }),
  fullByNumber: publicProcedure
    .input(z.object({ number: z.number() }))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findFirst({
        where: {
          number: req.input.number
        },
        include: {
          assignments: {
            include: {
              user: true,
              movie: true
            }
          },
          extras: {
            include: {
              review: {
                include: {
                  user: true,
                  movie: true
                }
              }
            }
          }
        }
      })
    }),
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const cursor = input?.cursor;

      const items = await ctx.prisma.episode.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: input.searchTerm ? {
          title: {
            contains: input.searchTerm,
          }
        } : undefined,
        orderBy: {
          number: 'desc'
        }
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),
  getSummary: publicProcedure
    .query(({ ctx }) => {
      return ctx.prisma.episode.count();
    }),
  getAudioMessages: protectedProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.audioEpisodeMessage.findMany({
        where: { episodeId: req.input.episodeId },
        include: {
          user: true
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
  addAudioMessage: protectedProcedure
    .input(z.object({
      episodeId: z.string(),
      url: z.string(),
      fileKey: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.audioEpisodeMessage.create({
        data: {
          episodeId: input.episodeId,
          url: input.url,
          fileKey: input.fileKey,
          notes: input.notes,
          userId: ctx.session.user.id
        }
      })
    }),
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
      title: z.string().optional()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.$transaction(async (tx) => {
        const episode = await tx.episode.update({
          where: { id: req.input.id },
          data: { status: req.input.status, title: req.input.title }
        });

        if (req.input.status === "recording" || req.input.status === "published") {
          await tx.gamblingPoints.updateMany({
            where: {
              assignment: {
                episodeId: req.input.id
              },
              status: "pending"
            },
            data: {
              status: "locked"
            }
          });
        }

        return episode;
      });
    }),
  updateDetails: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.update({
        where: { id: req.input.id },
        data: {
          title: req.input.title,
          description: req.input.description,
          notes: req.input.notes
        }
      })
    }),
  updateNotes: protectedProcedure
    .input(z.object({
      id: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.episode.update({
        where: { id: req.input.id },
        data: {
          notes: req.input.notes
        }
      })
    }),
  getByStatus: publicProcedure
    .input(z.object({ status: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.episode.findFirst({
        where: { status: req.input.status },
        orderBy: { number: 'desc' }
      });
    }),
  getRecordingData: protectedProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async (req) => {
      const episode = await req.ctx.prisma.episode.findUnique({
        where: { id: req.input.episodeId },
        include: {
          extras: {
            include: {
              review: {
                include: {
                  user: true,
                  movie: true,
                  rating: true,
                  show: true
                }
              }
            }
          },
          assignments: {
            include: {
              user: true,
              movie: true,
              assignmentReviews: {
                include: {
                  review: {
                    include: {
                      user: true,
                      movie: true,
                      rating: true
                    }
                  },
                  guesses: {
                    include: {
                      user: true,
                      rating: true,
                      point: true
                    }
                  }
                }
              },
              audioMessages: {
                include: {
                  user: true
                }
              }
            }
          },
          audioEpisodeMessages: {
            include: {
              user: true
            }
          }
        }
      });

      return episode;
    }),
});
