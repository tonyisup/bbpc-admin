import { type FC } from "react";
import type { Title } from "../server/tmdb/client";
import Image from "next/image";
interface ShowCardProps {
  show: Title
}

const ShowCard: FC<ShowCardProps> = ({ show }) => {
  return (
    <div className="w-full flex justify-center">
      <div>
        <figure>
          {show.poster_path && <Image unoptimized width={100} height={150} src={show.poster_path} alt={show.title} />}
          <figcaption className="text-center">
            {show?.title}
            <span className="text-xs"> ({(new Date(show?.release_date)).getFullYear()})</span>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}

export default ShowCard