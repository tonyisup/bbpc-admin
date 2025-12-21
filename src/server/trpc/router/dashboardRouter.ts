import { router, publicProcedure } from "../trpc";

export const dashboardRouter = router({
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [
      episodeCount,
      userCount,
      movieCount,
      reviewCount,
      latestEpisode,
      latestSyllabus,
      upcomingEpisode
    ] = await Promise.all([
      ctx.prisma.episode.count(),
      ctx.prisma.user.count(),
      ctx.prisma.movie.count(),
      ctx.prisma.review.count(),
      ctx.prisma.episode.findFirst({
        where: {
          status: 'published'
        },
        orderBy: { date: 'desc' },
        include: {
          assignments: {
            include: {
              movie: true,
              user: true
            }
          },
          extras: {
            include: {
              review: {
                include: {
                  user: true,
                  movie: true,
                  show: true
                }
              }
            }
          }

        }
      }),
      ctx.prisma.syllabus.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          movie: true
        }
      }),
      ctx.prisma.episode.findFirst({
        where: {
          status: 'next'
        },
        orderBy: { date: 'desc' },
        include: {
          assignments: {
            include: {
              movie: true,
              user: true
            }
          },
          extras: {
            include: {
              review: {
                include: {
                  user: true,
                  movie: true,
                  show: true
                }
              }
            }
          }
        }
      })
    ]);

    return {
      counts: {
        episodes: episodeCount,
        users: userCount,
        movies: movieCount,
        reviews: reviewCount
      },
      latestEpisode,
      upcomingEpisode,
      latestSyllabus
    };
  }),

  getGuessesStats: publicProcedure.query(async ({ ctx }) => {
    const episodes = await ctx.prisma.episode.findMany({
      take: 10,
      orderBy: { number: 'desc' },
      where: {
        recording: {
          not: null
        }
      },
      select: {
        id: true,
        number: true,
        title: true,
        assignments: {
          select: {
            assignmentReviews: {
              select: {
                guesses: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const data = episodes.map((ep) => {
      let guessCount = 0;
      ep.assignments.forEach((a) => {
        a.assignmentReviews.forEach((ar) => {
          guessCount += ar.guesses.length;
        });
      });
      return {
        id: ep.id,
        name: `Ep ${ep.number}`,
        fullTitle: `Episode ${ep.number}: ${ep.title}`,
        guesses: guessCount,
      };
    }).reverse();

    return data;
  })
});
