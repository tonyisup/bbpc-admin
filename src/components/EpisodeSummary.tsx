import Link from "next/link";
import type { FC } from "react";
import { trpc } from "../utils/trpc";
const EpisodeSummary: FC = () => {
  const { data: itemCount } = trpc.episode.getSummary.useQuery()
  return (
    <div>
      <span className="text-2xl font-semibold">
        <Link href="/episodes">
          Episodes
        </Link>
      </span>
      <span className="text-2xl font-semibold">({itemCount})</span>
    </div>
  )
}

export default EpisodeSummary