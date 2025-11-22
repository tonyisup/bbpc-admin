import { type FC } from "react";
import MovieCard from "../MovieCard";
import type { ExtraReview, Movie, Review, User } from "@prisma/client";

interface ExtraCardProps {
	extra: ExtraReview & {
		Review: Review & {
			User: User | null
			Movie: Movie
		}
	}
}

const ExtraCard: FC<ExtraCardProps> = ({ extra }) => {
	return (
		<div className="flex flex-col gap-2 items-center">
			<MovieCard movie={extra.Review.Movie} showTitle={false} />
			<span className="text-sm">
				{extra.Review.User?.name ?? 'Unknown'}
			</span>
		</div>
	)
}

export default ExtraCard