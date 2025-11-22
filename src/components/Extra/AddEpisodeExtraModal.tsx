import { type DispatchWithoutAction, type FC, useState } from "react";
import { trpc } from "../../utils/trpc";
import MovieFind from "../MovieFind";
import ShowFind from "../ShowFind";
import UserSelect from "../UserSelect";
import type { User, Movie, Episode, Show } from "@prisma/client";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../ui/dialog";
import { HiPlus } from "react-icons/hi";

interface AddEpisodeExtraModalProps {
	refreshItems: DispatchWithoutAction,
	episode: Episode
}

const AddEpisodeExtraModal: FC<AddEpisodeExtraModalProps> = ({refreshItems, episode}) => {
	const [modalOpen, setModalOpen] = useState(false)
	const [reviewer, setReviewer] = useState<User | null>(null)
	const [movie, setMovie] = useState<Movie | null>(null)
	const [show, setShow] = useState<Show | null>(null)
	const [type, setType] = useState<"movie" | "show">("movie")

	const {mutate: addExtra} = trpc.review.add.useMutation({
		onSuccess: () => {
			refreshItems()
			closeModal()
		}
	})
	const closeModal = function() {
		setModalOpen(false)
		setReviewer(null)
		setMovie(null)
		setShow(null)
		setType("movie")
	}
	const handleAddExtra = function() {
		if (reviewer && (movie || show)) {
			addExtra({
				episodeId: episode.id,
				userId: reviewer.id,
				movieId: type === "movie" ? movie?.id : undefined,
				showId: type === "show" ? show?.id : undefined,
			})
		}
	}
	return (
		<>
			<HiPlus
				className="cursor-pointer text-2xl"
				onClick={() => setModalOpen(true)}
			/>
			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Extra</DialogTitle>
					</DialogHeader>
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<label htmlFor="user">Assigner</label>
				<UserSelect selectUser={setReviewer} />

				<div className="col-span-2 flex gap-2">
					<label className="flex items-center gap-1">
						<input
							type="radio"
							name="type"
							checked={type === "movie"}
							onChange={() => { setType("movie"); setShow(null); }}
						/>
						Movie
					</label>
					<label className="flex items-center gap-1">
						<input
							type="radio"
							name="type"
							checked={type === "show"}
							onChange={() => { setType("show"); setMovie(null); }}
						/>
						TV Show
					</label>
				</div>

				<label htmlFor="item">{type === "movie" ? "Movie" : "TV Show"}</label>
				{type === "movie" ? (
					<MovieFind selectMovie={setMovie} />
				) : (
					<ShowFind selectShow={setShow} />
				)}

				<button
					onClick={closeModal}
					className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					onClick={handleAddExtra}
					disabled={!reviewer || (!movie && !show)}
					className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600 disabled:bg-gray-600 disabled:text-gray-400"
				>
					Add Extra
				</button>
			</div>
		</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
export default AddEpisodeExtraModal