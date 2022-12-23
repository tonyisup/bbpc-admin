import { Episode } from ".prisma/client";
import Link from "next/link";
import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";
import EpisodeModal from "./EpisodeModal";

const EpisodeSummary: FC = () => {
  const { data: itemCount } = trpc.user.getSummary.useQuery()
  return (
    <div>
      <span className="text-2xl font-semibold">
        <Link href="/users">
          Users
        </Link>
      </span>
      <span className="text-2xl font-semibold">({itemCount})</span>
    </div>
  )
}

export default EpisodeSummary