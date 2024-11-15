import type { Episode, Movie, User } from "@prisma/client";
import React, { type DispatchWithoutAction, type FC, useState } from "react"
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";
import MovieFind from "../MovieFind";
import UserSelect from "../UserSelect";


interface AddEpisodeAssignmentModalProps {
	refreshItems: DispatchWithoutAction
	episode: Episode
}

const AddEpisodeAssignmentModal: FC<AddEpisodeAssignmentModalProps> = ({refreshItems, episode}) => {
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ assigner, setAssigner ] = useState<User | null>(null);
	const [ movie, setMovie ] = useState<Movie | null>(null);
	const [ homework, setHomework ] = useState(false)
	const { mutate: addAssignment } = trpc.assignment.add.useMutation({
		onSuccess: () => {
			refreshItems();
			closeModal();
		}
	});
	const handleHomeworkChange = function() {
		setHomework(!homework)
	}
	const handleAddAssignment = function() {
    if (assigner && movie) {
      addAssignment({ 
        episodeId: episode.id, 
        userId: assigner.id, 
        movieId: movie.id,
				homework: homework
			})
    }
	}
  const closeModal = function() {
		setAssigner(null)
		setMovie(null)
    setModalOpen(false)
  }

	return <Modal isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Assignment" titleText="New Assignment">
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<label htmlFor="user">Assigner</label>
				<UserSelect selectUser={setAssigner} />
				<label htmlFor="movie">Movie</label>
				<MovieFind selectMovie={setMovie} />
				<div>
					<label>Homework</label>
					<input
						title="Homework"
						type="checkbox"
						className="rounded-md ml-2"
						checked={homework}
						onChange={handleHomeworkChange}
					/>
				</div>
				<button
					onClick={closeModal}
					className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					onClick={handleAddAssignment}
					disabled={!assigner || !movie}
					className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600 disabled:bg-gray-600 disabled:text-gray-400"
				>
					Add Assignment
				</button>
			</div>
		</div>
	</Modal>
}

export default AddEpisodeAssignmentModal;