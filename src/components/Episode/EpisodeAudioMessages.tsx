import { type Dispatch, type FC } from "react";
import { type AudioEpisodeMessage, type User, type Episode } from "@prisma/client";
import { trpc } from "../../utils/trpc";
import { X, User as UserIcon, Calendar, Play } from "lucide-react";
import Link from "next/link";

interface EpisodeAudioMessagesProps {
	episode: Episode
}

const EpisodeAudioMessages: FC<EpisodeAudioMessagesProps> = ({ episode }) => {
	const { data: audioMessages, refetch: refreshAudioMessages } = trpc.episode.getAudioMessages.useQuery({ episodeId: episode.id })

	if (!audioMessages || audioMessages.length === 0) {
		return <div className="text-center py-8 text-muted-foreground italic text-sm">No audio messages for this episode.</div>
	}

	return <div className="space-y-4">
		{audioMessages?.map((audioMessage) => (
			<Audio
				key={audioMessage.id}
				audioMessage={audioMessage}
				refreshAudioMessages={() => refreshAudioMessages()}
			/>
		))}
	</div>
}

interface AudioProps {
	audioMessage: AudioEpisodeMessage & {
		user: User | null
	},
	refreshAudioMessages: Dispatch<void>
}
const Audio: FC<AudioProps> = ({ audioMessage, refreshAudioMessages }) => {
	const { mutate: removeAudioMessage } = trpc.episode.removeAudioMessage.useMutation()
	return <div className="flex gap-4 w-full items-start justify-between bg-card border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
		<div className="flex flex-col gap-3 flex-1">
			<div className="flex justify-between items-center">
				<Link href={`/user/${audioMessage.user?.id}`} className="flex items-center gap-2 group">
					<div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
						<UserIcon className="h-3 w-3 text-primary" />
					</div>
					<span className="text-sm font-bold group-hover:text-primary transition-colors">
						{audioMessage.user?.name ?? audioMessage.user?.email}
					</span>
				</Link>
				<span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-full">
					<Calendar className="h-3 w-3" />
					{audioMessage.createdAt.toLocaleString()}
				</span>
			</div>
			<div className="flex items-center gap-3">
				<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
					<Play className="h-4 w-4 text-primary-foreground fill-current" />
				</div>
				<audio controls className="w-full max-w-md h-8 filter grayscale invert opacity-80 hover:opacity-100 transition-opacity">
					<source src={audioMessage.url} type="audio/mpeg" />
				</audio>
			</div>
			{audioMessage.notes && (
				<p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
					{audioMessage.notes}
				</p>
			)}
		</div>
		<button
			type="button"
			title="Remove Audio Message"
			className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
			onClick={() => {
				if (confirm("Are you sure you want to remove this audio message?")) {
					removeAudioMessage({ id: audioMessage.id }, { onSuccess: () => refreshAudioMessages() })
				}
			}}
		>
			<X className="h-4 w-4" />
		</button>
	</div>
}
export default EpisodeAudioMessages

