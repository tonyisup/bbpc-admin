import { Episode, Movie, User } from "@prisma/client"
import { Dispatch, SetStateAction, DispatchWithoutAction, FC, useState } from "react"
import { trpc } from "../../utils/trpc"
import MovieFind from "../MovieFind"
import UserSelect from "../UserSelect"

interface AssignmentModalProps {
  refreshItems: DispatchWithoutAction
  episode: Episode
}

const AssignmentModal: FC<AssignmentModalProps> = ({ refreshItems, episode}) => {
  const [ modalOpen, setModalOpen ] = useState<boolean> (false)
  const [ assigner, setAssigner ] = useState<User | null>(null)
  const [ movie, setMovie ] = useState<Movie | null>(null)
  const { mutate: addAssignment } = trpc.assignment.add.useMutation({
    onSuccess: () => {
      refreshItems()
      closeModal()
    }
  })
  const handleAddAssignment = function() {
    if (assigner && movie) {
      addAssignment({ 
        episodeId: episode.id, 
        userId: assigner.id, 
        movieId: movie.id })
    }
  }
  const openModal = function() {
    setModalOpen(true)
  }
  const closeModal = function() {
    setModalOpen(false)
  }
  return <>
    {!modalOpen &&   <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={openModal}
      >
        Add Assignment
      </button>}
    {modalOpen &&
    <div className=" text-white absolute inset-0 flex items-center justify-center bg-black/75">
      <div className="p-3 space-y-4 bg-gray-800">
        <h3 className="text-xl font-medium">New Assignment</h3>
        <div className="grid grid-cols-2 gap-2">
          <label htmlFor="user">Assigner</label>
          <UserSelect selectUser={setAssigner} />
          <label htmlFor="movie">Movie</label>
          <MovieFind selectMovie={setMovie} />
          <button
            onClick={closeModal}
            className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleAddAssignment}
            className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>}
  </>
}

export default AssignmentModal