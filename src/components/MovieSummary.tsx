import Link from "next/link";
import { type FC } from "react";
import { trpc } from "../utils/trpc";

const MovieSummary: FC = () => {
  const { data: itemCount } = trpc.movie.getSummary.useQuery()
  return (
    <div>
      <span className="text-2xl font-semibold">
        <Link href="/movies">
          Movies
        </Link>
      </span>
      <span className="text-2xl font-semibold">({itemCount})</span>
    </div>
  )
}

export default MovieSummary