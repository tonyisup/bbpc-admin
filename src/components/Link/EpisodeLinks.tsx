import { type FC, useState } from "react";
import type { Episode } from "@prisma/client";
import { Link2, Plus, ExternalLink, Globe, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "../../utils/trpc";
import AddEpisodeLinkModal from "./AddEpisodeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EpisodeLinksProps {
	episode: Episode
}

const EpisodeLinks: FC<EpisodeLinksProps> = ({ episode }) => {
	const [isLinksVisible, setIsLinksVisible] = useState(true)
	const [modalOpen, setModalOpen] = useState(false)
	const { data: ep, refetch: refreshLinks } = trpc.episode.getLinks.useQuery({ id: episode.id })

	const { mutate: removeLink } = trpc.episode.removeLink.useMutation({
		onSuccess: () => refreshLinks()
	})

	return (
		<Card className="border-none shadow-none bg-transparent">
			<CardHeader className="flex flex-row items-center justify-between px-6 pb-2">
				<div className="flex items-center gap-2">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<Link2 className="h-5 w-5 text-primary" />
						Links
					</CardTitle>
					<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
						{ep?.links.length ?? 0}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsLinksVisible(!isLinksVisible)}
						className="h-8 w-8 p-0"
					>
						{isLinksVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
					</Button>
					<Button
						size="sm"
						className="gap-1.5 h-8 font-bold"
						onClick={() => setModalOpen(true)}
					>
						<Plus className="h-3.5 w-3.5" />
						Add Link
					</Button>
				</div>
			</CardHeader>

			{isLinksVisible && (
				<CardContent className="px-6 pt-4">
					{ep?.links && ep.links.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{ep.links.map((link) => (
								<div key={link.id} className="group flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-card hover:border-primary/20 transition-all shadow-sm">
									<div className="flex items-center gap-3 min-w-0">
										<div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
											<Globe className="h-4 w-4 text-primary/60" />
										</div>
										<div className="flex flex-col min-w-0">
											<span className="text-sm font-bold truncate">{link.text}</span>
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[10px] text-muted-foreground truncate hover:underline flex items-center gap-1"
											>
												{link.url} <ExternalLink className="h-2 w-2" />
											</a>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
										onClick={() => {
											if (confirm("Delete this link?")) removeLink({ id: link.id })
										}}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 bg-muted/20 border-2 border-dashed rounded-xl">
							<p className="text-xs text-muted-foreground italic">No links added to this episode yet.</p>
						</div>
					)}
				</CardContent>
			)}

			<AddEpisodeLinkModal
				episode={episode}
				refreshItems={refreshLinks}
				open={modalOpen}
				onOpenChange={setModalOpen}
			/>
		</Card>
	)
}

export default EpisodeLinks