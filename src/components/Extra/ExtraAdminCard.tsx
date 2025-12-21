import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { type FC } from "react";
import MovieCard from "../MovieCard";
import ShowCard from "../ShowCard";
import { HiTrash } from "react-icons/hi";
import type { RouterOutputs } from "../../utils/trpc";
import { trpc } from "../../utils/trpc";

interface ExtraAdminCardProps {
	extra: RouterOutputs['review']['getExtrasForEpisode'][number]
	refreshExtras: () => void
}

const ExtraAdminCard: FC<ExtraAdminCardProps> = ({ extra, refreshExtras }) => {
	const { mutate: removeExtra } = trpc.review.remove.useMutation({
		onSuccess: () => refreshExtras()
	})
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{extra.movie?.title ?? extra.show?.title ?? "Unknown"}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2 items-center">
				{extra.movie && <MovieCard movie={extra.movie} showTitle={false} />}
				{extra.show && <ShowCard show={extra.show} />}
				<span className="text-sm">
					{extra.user?.name ?? 'Unknown'}
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

export default ExtraAdminCard