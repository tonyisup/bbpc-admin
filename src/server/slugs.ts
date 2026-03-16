import { Prisma, PrismaClient } from "@prisma/client";

const MAX_SLUG_LENGTH = 255;
const SUFFIX_RESERVE = 16;

type SlugDbClient = PrismaClient | Prisma.TransactionClient;
type SlugEntity = "episode" | "assignment";

const ASSIGNMENT_TYPE_LABELS = {
  HOMEWORK: "homework",
  EXTRA_CREDIT: "extra-credit",
  BONUS: "bonus",
} as const;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function slugify(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, MAX_SLUG_LENGTH - SUFFIX_RESERVE).replace(/-+$/g, "");
}

export function buildEpisodeSlugBase(input: { number: number; title: string }) {
  return slugify(`episode-${input.number}-${input.title || "episode"}`);
}

export function buildAssignmentSlugBase(input: {
  episodeNumber: number;
  userId: string;
  userName: string | null | undefined;
  movieTitle: string | null | undefined;
  type: keyof typeof ASSIGNMENT_TYPE_LABELS;
}) {
  const userLabel = input.userName?.trim() || `user-${input.userId.slice(0, 8)}`;
  const movieLabel = input.movieTitle?.trim() || "assignment";

  return slugify(
    `episode-${input.episodeNumber}-${userLabel}-${movieLabel}-${ASSIGNMENT_TYPE_LABELS[input.type]}`,
  );
}

async function slugExists(
  prisma: SlugDbClient,
  entity: SlugEntity,
  slug: string,
  excludeId?: string,
) {
  if (entity === "episode") {
    const existing = await prisma.episode.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return !!existing;
  }

  const existing = await prisma.assignment.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  return !!existing;
}

async function ensureUniqueSlug(
  prisma: SlugDbClient,
  entity: SlugEntity,
  baseSlug: string,
  excludeId?: string,
) {
  const safeBase = baseSlug || entity;

  if (!(await slugExists(prisma, entity, safeBase, excludeId))) {
    return safeBase;
  }

  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const candidate = `${safeBase.slice(0, MAX_SLUG_LENGTH - `-${suffix}`.length)}-${suffix}`;
    if (!(await slugExists(prisma, entity, candidate, excludeId))) {
      return candidate;
    }
  }

  throw new Error(`Unable to allocate unique ${entity} slug for ${safeBase}`);
}

export async function createUniqueEpisodeSlug(
  prisma: SlugDbClient,
  input: { number: number; title: string },
  excludeId?: string,
) {
  return ensureUniqueSlug(prisma, "episode", buildEpisodeSlugBase(input), excludeId);
}

export async function createUniqueAssignmentSlug(
  prisma: SlugDbClient,
  input: {
    episodeNumber: number;
    userId: string;
    userName: string | null | undefined;
    movieTitle: string | null | undefined;
    type: keyof typeof ASSIGNMENT_TYPE_LABELS;
  },
  excludeId?: string,
) {
  return ensureUniqueSlug(prisma, "assignment", buildAssignmentSlugBase(input), excludeId);
}
