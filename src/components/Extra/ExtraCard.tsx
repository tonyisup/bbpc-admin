import { type FC } from "react";
import MovieCard from "../MovieCard";
import ShowCard from "../ShowCard";
import type { ExtraReview, Movie, Review, Show, User } from "@prisma/client";

interface ExtraCardProps {
	extra: ExtraReview & {
		review: Review & {
			user: User | null
			movie: Movie | null
			show: Show | null
		}
	}
}

const ExtraCard: FC<ExtraCardProps> = ({ extra }) => {
	const title = extra.review.movie?.title ?? extra.review.show?.title ?? "Unknown";
	const item = extra.review.movie ? extra.review.movie : extra.review.show;
	const type = extra.review.movie ? "movie" : "show";
	return (
		<div className="flex flex-col gap-2 items-center">
			{type === "movie" && extra.review.movie && <MovieCard movie={extra.review.movie} showTitle={false} />}
			{type === "show" && extra.review.show && <ShowCard show={extra.review.show as any} />}
			<span className="text-sm">
				{extra.review.user?.name ?? 'Unknown'}
			</span>
		</div>
	)
}

export default ExtraCard