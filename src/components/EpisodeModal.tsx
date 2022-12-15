import { Episode } from ".prisma/client";
import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";

interface EpisodeModalProps {
  setModalOpen: Dispatch<SetStateAction<boolean>>
  refreshEpisodes: DispatchWithoutAction
}

const EpisodeModal: FC<EpisodeModalProps> = ({setModalOpen, refreshEpisodes}) => {
  const {mutate: addEpisode} = trpc.episode.add.useMutation({
    onSuccess: () => {
      refreshEpisodes()
    }
  });
  const [episodeNumber, setEpisodeNumber] = useState<number>(0);
  const [episodeTitle, setEpisodeTitle] = useState<string>("");
  return <div className=" text-white absolute inset-0 flex items-center justify-center bg-black/75">
    <div className="p-3 space-y-4 bg-gray-800">
      <h3 className="text-xl font-medium">New Episode</h3>
      <div>
        <label htmlFor="number">Number</label>
        <input
          type="number"
          name="number"
          value={episodeNumber}
          onChange={(e) => setEpisodeNumber(e.target.valueAsNumber)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          name="title"
          value={episodeTitle}
          onChange={(e) => setEpisodeTitle(e.target.value)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setModalOpen(false)}
          className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            addEpisode({ number: episodeNumber, title: episodeTitle })
            setModalOpen(false)
          }}
          className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
        >
          Add
        </button>
        </div>
    </div>
  </div>
}

export default EpisodeModal