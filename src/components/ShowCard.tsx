import { type FC } from "react";
import Image from "next/image";
import type { Show } from "@prisma/client";
interface ShowCardProps {
  show: Show
}

const ShowCard: FC<ShowCardProps> = ({ show }) => {
  return (
    <div className="w-full flex justify-center">
      <div>
        <figure>
          {show.poster && <Image unoptimized width={100} height={150} src={show.poster} alt={show.title} />}
          <figcaption className="text-center">
            {show?.title}
            <span className="text-xs"> ({show?.year})</span>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}

export default ShowCard