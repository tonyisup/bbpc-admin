import { type FC } from "react";
import type { Title } from "../server/tmdb/client";
import Image from "next/image";
import { getPlainDateYear } from "@/lib/dates";
interface TitleCardProps {
  title: Title
}

const TitleCard: FC<TitleCardProps> = ({ title }) => {
  return (
    <div className="w-full flex justify-center">
      <div>
        <figure>
          {title.poster_path && <Image unoptimized width={100} height={150} src={title.poster_path} alt={title.title} />} 
          <figcaption className="text-center">
            {title?.title} 
            <span className="text-xs"> ({getPlainDateYear(title?.release_date) ?? ""})</span>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}

export default TitleCard
