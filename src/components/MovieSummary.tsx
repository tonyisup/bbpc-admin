import { Episode } from ".prisma/client";
import Link from "next/link";
import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";
import EpisodeModal from "./EpisodeModal";

const MovieSummary: FC = () => {
  const { data: itemCount } = trpc.movie.getSummary.useQuery()
  return (
    <>
      <span className="text-2xl font-semibold">
        <Link href="/movies">
          Movies
        </Link>
      </span>
      <span className="text-2xl font-semibold">({itemCount})</span>
     </>
  )
}

export default MovieSummary