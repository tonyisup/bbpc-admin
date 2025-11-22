import { router, publicProcedure } from "../trpc";

export const dashboardRouter = router({
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [
      episodeCount,
      userCount,
      movieCount,
      reviewCount,
      latestEpisode,
      latestSyllabus
    ] = await Promise.all([
      ctx.prisma.episode.count(),
      ctx.prisma.user.count(),
      ctx.prisma.movie.count(),
      ctx.prisma.review.count(),
      ctx.prisma.episode.findFirst({
        where: {
          recording: {
            not: null
          }
        },
        orderBy: { number: 'desc' },
        include: {
          assignments: {
            include: {
              Movie: true,
              User: true
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
      }),
      ctx.prisma.syllabus.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          User: true,
          Movie: true
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
