import type { Episode } from "@prisma/client";
import { type FC, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { trpc } from "../../utils/trpc";
import MovieCard from "../MovieCard";
import AddEpisodeExtraModal from "./AddEpisodeExtraModal";

interface EpsideExtrasProps {
	episode: Episode
}

const EpisodeExtras: FC<EpsideExtrasProps> = ({ episode }) => {
	const [isExtrasVisible, setIsExtrasVisible] = useState(false)
	const {data: extras, refetch: refreshExtras} = trpc.review.getExtrasForEpisode.useQuery({ episodeId: episode.id})
	const {mutate: removeExtra} = trpc.review.remove.useMutation({
		onSuccess: () => refreshExtras()
	})
	const showExtras = function() {
		setIsExtrasVisible(true)
	}
	const hideExtras = function() {
		setIsExtrasVisible(false)
	}
	return (
		<section className="flex flex-col w-full px-6">
			<div className="flex justify-between w-full">
				<h2 className="text-xl font-semibold">Extras ({extras?.length ?? 0})</h2>
				{isExtrasVisible && <ChevronUp className="cursor-pointer" onClick={hideExtras} />}
				{!isExtrasVisible && <ChevronDown className="cursor-pointer" onClick={showExtras} />}
				{episode && <AddEpisodeExtraModal episode={episode} refreshItems={refreshExtras} />}
			</div>
			{isExtrasVisible && <div className="grid grid-cols-3 w-full">
						{extras?.map((extra) => (
							extra.Movie && <div key={extra.movieId} className="flex">
									<MovieCard movie={extra.Movie}  />
									<div className="flex flex-col justify-between">
										<X
											className="text-red-500 cursor-pointer"
											onClick={() => removeExtra({id: extra.id})}
										/>
										{extra.User && <div className="w-full">{extra.User.name}</div>}
									</div>
								</div>
						))}
			</div>}
		</section>
	)
}

export default EpisodeExtras