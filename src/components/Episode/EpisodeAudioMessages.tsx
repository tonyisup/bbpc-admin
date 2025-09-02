import { type Dispatch, type FC } from "react";
import { type AudioEpisodeMessage, type User, type Episode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { trpc } from "../../utils/trpc";
import { X } from "lucide-react";
import Link from "next/link";

interface EpisodeAudioMessagesProps {
	episode: Episode
}

const EpisodeAudioMessages: FC<EpisodeAudioMessagesProps> = ({ episode }) => {
	const { data: audioMessages, refetch: refreshAudioMessages } = trpc.episode.getAudioMessages.useQuery({ episodeId: episode.id })
	const handleRefreshAudioMessages = function () {
		refreshAudioMessages();
	}
  return <div>
    {audioMessages?.map((audioMessage) => (
      <Audio 
        key={audioMessage.id} 
        audioMessage={audioMessage} 
        refreshAudioMessages={handleRefreshAudioMessages} 
      />
    ))}
  </div>
}

interface AudioProps {
	audioMessage: AudioEpisodeMessage & {
		User: User | null
	},
	refreshAudioMessages: Dispatch<void>
}
const Audio: FC<AudioProps> = ({ audioMessage, refreshAudioMessages }) => {
	const { mutate: removeAudioMessage } = trpc.episode.removeAudioMessage.useMutation()
	return <div className="flex gap-4 w-full px-6 items-center justify-between">
		<a className="text-blue-500 underline" href={audioMessage.url} target="_blank" rel="noreferrer">
			{audioMessage.id} - {audioMessage.createdAt.toLocaleString()} 
		</a>
		<span>
			<Link href={`/user/${audioMessage.User?.id}`}>
				{audioMessage.User?.name ?? audioMessage.User?.email}
			</Link>
		</span>
		<Button
			variant="ghost"
			title="Remove Audio Message"
			className="ml-2 text-red-500 hover:text-red-700"
			onClick={() => {
				removeAudioMessage({ id: audioMessage.id }, { onSuccess: () => refreshAudioMessages() })
			}}
		>
			<X />
		</Button>
	</div>
}
export default EpisodeAudioMessages

