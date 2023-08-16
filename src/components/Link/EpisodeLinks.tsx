import { Episode } from ".prisma/client";
import { FC, useState } from "react";
import { HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import { trpc } from "../../utils/trpc";
import AddEpisodeLinkModal from "./AddEpisodeLink";

interface EpisodeLinksProps {
	episode: Episode
}

const EpisodeLinks: FC<EpisodeLinksProps> = ({ episode }) => {
	const [isLinksVisible, setIsLinksVisible] = useState(false)
	const {data: ep, refetch: refreshLinks} = trpc.episode.getLinks.useQuery({ id: episode.id})
	const {mutate: removeExtra} = trpc.review.remove.useMutation({
		onSuccess: () => refreshLinks()
	})
	const showLinks = function() {
		setIsLinksVisible(true)
	}
	const hideLinks = function() {
		setIsLinksVisible(false)
	}
	return (
		<section className="flex flex-col w-full px-6">
			<div className="flex justify-between w-full">
				<h2 className="text-xl font-semibold">Links ({ep?.links.length ?? 0})</h2>
				{isLinksVisible && <HiChevronUp className="cursor-pointer" onClick={hideLinks} />}
				{!isLinksVisible && <HiChevronDown className="cursor-pointer" onClick={showLinks} />}
				{episode && <AddEpisodeLinkModal episode={episode} refreshItems={refreshLinks} />}
			</div>
			{isLinksVisible && <div className="grid grid-cols-3 w-full">
						{ep?.links?.map((link, index) => (
							link && <div key={link.id} className="flex">
									<a href={link.url}>{link.text}</a>
								</div>
						))}
			</div>}
		</section>
	)
}

export default EpisodeLinks