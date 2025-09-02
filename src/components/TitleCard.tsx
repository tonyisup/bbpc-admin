import { type FC } from "react";
import type { Title } from "../server/tmdb/client";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
interface TitleCardProps {
  title: Title
}

const TitleCard: FC<TitleCardProps> = ({ title }) => {
  return (
    <Card>
      <CardContent>
        {title.poster_path && <Image unoptimized width={100} height={150} src={title.poster_path} alt={title.title} />}
      </CardContent>
      <CardFooter>
        <p className="text-center">
          {title?.title}
          <span className="text-xs"> ({(new Date(title?.release_date)).getFullYear()})</span>
        </p>
      </CardFooter>
    </Card>
  )
}

export default TitleCard