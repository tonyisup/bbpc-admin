import type { Episode, Movie, User } from "@prisma/client";
import React, { type DispatchWithoutAction, type FC, useState } from "react"
import { trpc } from "../../utils/trpc";
import MovieFind from "../MovieFind";
import UserSelect from "../UserSelect";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../ui/dialog";
import { HiPlus } from "react-icons/hi";


interface AddEpisodeAssignmentModalProps {
	refreshItems: DispatchWithoutAction
	episode: Episode
}

const AddEpisodeAssignmentModal: FC<AddEpisodeAssignmentModalProps> = ({refreshItems, episode}) => {
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ assigner, setAssigner ] = useState<User | null>(null);
	const [ movie, setMovie ] = useState<Movie | null>(null);
	const [ assignmentType, setAssignmentType ] = useState<"HOMEWORK" | "EXTRA_CREDIT" | "BONUS">("HOMEWORK")
	const { mutate: addAssignment } = trpc.assignment.add.useMutation({
		onSuccess: () => {
			refreshItems();
			closeModal();
		}
	});
	const handleAssignmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setAssignmentType(e.target.value as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS")
	}
	const handleAddAssignment = function() {
    if (assigner && movie) {
      addAssignment({ 
        episodeId: episode.id, 
        userId: assigner.id, 
        movieId: movie.id,
				type: assignmentType
			})
    }
	}
  const closeModal = function() {
		setAssigner(null)
		setMovie(null)
		setAssignmentType("HOMEWORK")
    setModalOpen(false)
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
						<DialogTitle>Add New User</DialogTitle>
					</DialogHeader>
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<label htmlFor="user">Assigner</label>
				<UserSelect selectUser={setAssigner} />
				<label htmlFor="movie">Movie</label>
				<MovieFind selectMovie={setMovie} />
				<label htmlFor="type">Assignment Type</label>
				<select
					id="type"
					value={assignmentType}
					onChange={handleAssignmentTypeChange}
					className="rounded-md bg-gray-700 text-white p-1"
				>
					<option value="HOMEWORK">Homework</option>
					<option value="EXTRA_CREDIT">Extra Credit</option>
					<option value="BONUS">Bonus</option>
				</select>
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
				</DialogContent>
			</Dialog>
		</>
	);
}

export default AddEpisodeAssignmentModal;