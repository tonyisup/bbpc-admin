
import { type Season } from "@prisma/client";
import Link from "next/link";

type SeasonsListProps = {
  seasons?: Season[];
};

export const SeasonsList = ({ seasons }: SeasonsListProps) => {
  return (
    <ul>
      {seasons?.map((season) => (
        <li key={season.id}>
          <Link href={`/season/${season.id}`}>
            <div className="flex gap-2">
              <p>{season.title}</p>
              <p>{season.description}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};
