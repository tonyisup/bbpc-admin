import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { type FC } from "react";
import MovieCard from "../MovieCard";
import ShowCard from "../ShowCard";
import { HiTrash } from "react-icons/hi";
import type { RouterOutputs } from "../../utils/trpc";
import { trpc } from "../../utils/trpc";

interface ExtraCardProps {
	extra: RouterOutputs['review']['getExtrasForEpisode'][number]
	refreshExtras: () => void
}

const ExtraCard: FC<ExtraCardProps> = ({ extra, refreshExtras }) => {
	const { mutate: removeExtra } = trpc.review.remove.useMutation({
		onSuccess: () => refreshExtras()
	})

	const title = extra.Movie?.title ?? extra.Show?.title ?? "Unknown";
	const item = extra.Movie ? extra.Movie : extra.Show;
	const type = extra.Movie ? "movie" : "show";

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2 items-center">
				{type === "movie" && extra.Movie && <MovieCard movie={extra.Movie} showTitle={false} />}
				{type === "show" && extra.Show && <ShowCard show={extra.Show as any} />}
				<span className="text-sm">
					{extra.User?.name ?? 'Unknown'}
				</span>
			</CardContent>
			<CardFooter>
				<div className="w-full flex gap-2 justify-between items-center">
					<HiTrash className="text-red-500 cursor-pointer" onClick={() => removeExtra({ id: extra.id })} />
				</div>
			</CardFooter>
		</Card>
	)
}

export default ExtraCard