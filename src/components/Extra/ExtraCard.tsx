import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { type FC } from "react";
import MovieCard from "../MovieCard";
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
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{extra.Movie.title}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2 items-center">
				<MovieCard movie={extra.Movie} showTitle={false} />
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