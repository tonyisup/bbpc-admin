import { Episode } from ".prisma/client";
import Link from "next/link";
import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";
import EpisodeModal from "./EpisodeModal";

const EpisodeSummary: FC = () => {
  const refresh: DispatchWithoutAction = () => refetchEpisodeCount()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const { data: episodeCount, refetch: refetchEpisodeCount } = trpc.episode.getSummary.useQuery()
  return (
    <>
      {modalOpen && <EpisodeModal setModalOpen={setModalOpen} refreshEpisodes={refresh} />}

      <div>
        <span className="text-2xl font-semibold">
          <Link href="/episodes">
            Episodes
          </Link>
        </span>
        <span className="text-sm text-gray-500 ml-2">({episodeCount})</span>
        <button
          type="button" 
          onClick={() => setModalOpen(true)}
          className="bg-violet-500 text-white text-sm p-2 rounded-md transition hover:bg-violet-400">
          Add Episode
        </button>
      </div>
     </>
  )
}

export default EpisodeSummary