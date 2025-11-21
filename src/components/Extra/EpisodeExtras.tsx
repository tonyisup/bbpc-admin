import type { Episode } from "@prisma/client";
import { type FC, useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { trpc } from "../../utils/trpc";
import AddEpisodeExtraModal from "./AddEpisodeExtraModal";
import ExtraCard from "./ExtraCard";

interface EpsideExtrasProps {
	episode: Episode
}

const EpisodeExtras: FC<EpsideExtrasProps> = ({ episode }) => {
	const [isExtrasVisible, setIsExtrasVisible] = useState(false)
	const { data: extras, refetch: refreshExtras } = trpc.review.getExtrasForEpisode.useQuery({ episodeId: episode.id })
	const showExtras = function () {
		setIsExtrasVisible(true)
	}
	const hideExtras = function () {
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
			{isExtrasVisible && <div className="flex gap-4">
				{extras?.map((extra) => <ExtraCard key={extra.id} extra={extra} refreshExtras={refreshExtras} />)}
			</div>}
		</section>
	)
}

export default EpisodeExtras