import { Episode } from ".prisma/client";
import { CarouselProvider, ButtonBack, ButtonNext, Slider, Slide } from "pure-react-carousel";
import { FC, useState } from "react";
import { HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import { trpc } from "../../utils/trpc";
import MovieCard from "../MovieCard";
import AddEpisodeExtraModal from "./AddEpisodeExtraModal";

interface EpsideExtrasProps {
	episode: Episode
}

const EpisodeExtras: FC<EpsideExtrasProps> = ({ episode }) => {
	const [isExtrasVisible, setIsExtrasVisible] = useState(false)
	const {data: extras, refetch: refreshExtras} = trpc.review.getForEpisode.useQuery({ episodeId: episode.id})
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
				{isExtrasVisible && <HiChevronUp className="cursor-pointer" onClick={hideExtras} />}
				{!isExtrasVisible && <HiChevronDown className="cursor-pointer" onClick={showExtras} />}
				{episode && <AddEpisodeExtraModal episode={episode} refreshItems={refreshExtras} />}
			</div>
			{isExtrasVisible && <div className="grid grid-cols-3 w-full">
						{extras?.map((extra, index) => (
							extra.movie && <div className="flex">
									<MovieCard movie={extra.movie}  />
									<div className="flex flex-col justify-between">
										<HiX
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