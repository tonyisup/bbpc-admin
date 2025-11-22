import type { Show } from "@prisma/client";
import { type Dispatch, type FC, type SetStateAction, useState } from "react";
import type { Title } from "../server/tmdb/client";
import { trpc } from "../utils/trpc";
import ShowCard from "./ShowCard";
import TitleCard from "./TitleCard";
import ShowSearch from "./ShowSearch";

interface ShowFindProps {
  selectShow: Dispatch<SetStateAction<Show | null>>;
}

const ShowFind: FC<ShowFindProps> = ({
  selectShow
}) => {
  const [ selectedShow, setSelectedShow ] = useState<Show | null>(null)
  const [ title, setTitle ] = useState<Title | null>(null)

  const { data: temp_title } = trpc.show.getTitle.useQuery({
    id: title?.id ?? 0
  }, {
    onSuccess: (result) => {
      if (!title) return;
      if (!result) return;
			if (!title.poster_path) return;

      const year = (new Date(result.release_date)).getFullYear()

      addShow({
        title: result.title,
        year: year,
        poster: result.poster_path,
        url: result.imdb_path || `https://www.themoviedb.org/tv/${result.id}`
      })
    }
  })
  const { mutate: addShow } = trpc.show.add.useMutation({
    onSuccess: (result) => {
      setSelectedShow(result)
      selectShow(result)
    }
  })

  return (
    <div className="w-full flex flex-col justify-center">
      {selectedShow && <ShowCard show={selectedShow as any} />}
      {!selectedShow && title && <TitleCard title={title} />}
      {!selectedShow && !title && <div className="col-span-2">No show selected</div>}
      <ShowSearch setShow={setTitle} />
    </div>
)}
export default ShowFind