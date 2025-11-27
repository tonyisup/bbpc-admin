import { PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const calculateUserPoints = async (
  prisma: PrismaTransactionClient,
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

  return pointsResult._sum.value ?? 0;
};
