import { PrismaClient } from "@prisma/client";

export const calculateUserPoints = async (
  prisma: PrismaClient,
  userId: string,
  seasonId: string
) => {
  const pointsResult = await prisma.point.aggregate({
    _sum: {
      value: true,
    },
    where: {
      userId,
      seasonId,
    },
  });

  const guessPointsResult = await prisma.guess.aggregate({
    _sum: {
      points: true,
    },
    where: {
      userId,
      seasonId,
    },
  });

  const gamblingResults = await prisma.gamblingPoints.findMany({
    where: {
      userId: userId,
      seasonId: seasonId,
    },
  });

  const gamblingPoints = gamblingResults.reduce((acc, gamble) => {
    if (gamble.successful === true) {
        // Won the gamble, gets stake back + equal amount. Net gain of points.
        return acc + gamble.points;
    } else {
        // Lost the gamble or pending, stake is gone. Net loss of points.
        return acc - gamble.points;
    }
  }, 0);

  const seasonalPoints = (pointsResult._sum.value || 0) + (guessPointsResult._sum.points || 0);

  return seasonalPoints + gamblingPoints;
};
