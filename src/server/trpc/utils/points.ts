import { PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const calculateUserPoints = async (
  prisma: PrismaTransactionClient,
  userId: string,
  seasonId: string | null | undefined
) => {
  let seasonIdToUse = seasonId;
  if (!seasonIdToUse) {
    const season = await prisma.season.findFirst({
      orderBy: {
        startedOn: 'desc',
      },
      where: { endedOn: null }
    });
    seasonIdToUse = season?.id ?? '';
  }

  const adjustmentResult = await prisma.point.aggregate({
    _sum: {
      adjustment: true,
    },
    where: {
      userId,
      seasonId: seasonIdToUse,
    },
  });

  /* points to sum are in the linked gamepoint.points table */

  const pointsResult = await prisma.gamePointType.aggregate({
    _sum: {
      points: true,
    },
    where: {
      Point: {
        every: {
          userId,
          seasonId: seasonIdToUse,
        },
      },
    },
  });
  return (pointsResult._sum.points ?? 0)
    + (adjustmentResult._sum.adjustment ?? 0);
};

export const getCurrentSeasonID = async (prisma: PrismaTransactionClient) => {
  const season = await prisma.season.findFirst({
    orderBy: {
      startedOn: 'desc',
    },
    where: { endedOn: null }
  });
  return season?.id ?? '';
};