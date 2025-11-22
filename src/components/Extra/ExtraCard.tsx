import { type FC } from "react";
import MovieCard from "../MovieCard";
import ShowCard from "../ShowCard";
import type { ExtraReview, Movie, Review, Show, User } from "@prisma/client";

interface ExtraCardProps {
	extra: ExtraReview & {
		Review: Review & {
			User: User | null
			Movie: Movie | null
			Show: Show | null
		}
	}
}

const ExtraCard: FC<ExtraCardProps> = ({ extra }) => {
	const title = extra.Review.Movie?.title ?? extra.Review.Show?.title ?? "Unknown";
	const item = extra.Review.Movie ? extra.Review.Movie : extra.Review.Show;
	const type = extra.Review.Movie ? "movie" : "show";
	return (
		<div className="flex flex-col gap-2 items-center">
			{type === "movie" && extra.Review.Movie && <MovieCard movie={extra.Review.Movie} showTitle={false} />}
			{type === "show" && extra.Review.Show && <ShowCard show={extra.Review.Show as any} />}
			<span className="text-sm">
				{extra.Review.User?.name ?? 'Unknown'}
			</span>
		</div>
	)
}

export default ExtraCard