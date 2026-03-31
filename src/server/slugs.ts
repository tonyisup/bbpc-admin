import type { Prisma, PrismaClient } from "@prisma/client";

const MAX_SLUG_LENGTH = 255;
const SUFFIX_RESERVE = 16;

type SlugDbClient = PrismaClient | Prisma.TransactionClient;
type SlugEntity = "episode" | "assignment";

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
  movieTitle: string | null | undefined;
  userId?: string;
  userName?: string | null;
  assignmentType?: string | null;
}) {
  const episodeLabel = `episode-${input.episodeNumber}`;
  const movieLabel = input.movieTitle?.trim() || "assignment";
  const userLabel = input.userName?.trim() || input.userId?.trim().slice(0, 8) || "user";
  const typeLabel = input.assignmentType?.trim() || "assignment";

  return slugify(
    `${episodeLabel}-${userLabel}-${typeLabel}-${movieLabel}`,
  );
}

async function getExistingSlugs(
  prisma: SlugDbClient,
  entity: SlugEntity,
  safeBase: string,
  excludeId?: string,
) {
  if (entity === "episode") {
    const existing = await prisma.episode.findMany({
      where: {
        slug: {
          startsWith: safeBase,
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { slug: true },
    });

    return new Set(existing.flatMap((item: { slug: string | null }) => (item.slug ? [item.slug] : [])));
  }

  const existing = await prisma.assignment.findMany({
    where: {
      slug: {
        startsWith: safeBase,
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });

  return new Set(existing.flatMap((item: { slug: string | null }) => (item.slug ? [item.slug] : [])));
}

async function ensureUniqueSlug(
  prisma: SlugDbClient,
  entity: SlugEntity,
  baseSlug: string,
  excludeId?: string,
) {
  const safeBase = (baseSlug || entity).slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "") || entity;
  const existingSlugs = await getExistingSlugs(prisma, entity, safeBase, excludeId);

  if (!existingSlugs.has(safeBase)) {
    return safeBase;
  }

  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const candidate = `${safeBase.slice(0, MAX_SLUG_LENGTH - `-${suffix}`.length)}-${suffix}`;
    if (!existingSlugs.has(candidate)) {
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
    movieTitle: string | null | undefined;
    userId?: string;
    userName?: string | null;
    assignmentType?: string | null;
  },
  excludeId?: string,
) {
  return ensureUniqueSlug(prisma, "assignment", buildAssignmentSlugBase(input), excludeId);
}
