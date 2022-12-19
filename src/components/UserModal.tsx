import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";

interface EpisodeModalProps {
  setModalOpen: Dispatch<SetStateAction<boolean>>
  refreshItems: DispatchWithoutAction
}

const EpisodeModal: FC<EpisodeModalProps> = ({setModalOpen, refreshItems: refreshItems}) => {
  const {mutate: addItem} = trpc.user.add.useMutation({
    onSuccess: () => {
      refreshItems()
    }
  });
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  return <div className=" text-white absolute inset-0 flex items-center justify-center bg-black/75">
    <div className="p-3 space-y-4 bg-gray-800">
      <h3 className="text-xl font-medium">New User</h3>
      <div>
        <label htmlFor="number">Name</label>
        <input
          type="text"
          name="name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setModalOpen(false)}
          className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            addItem({ name: userName, email: userEmail })
            setModalOpen(false)
          }}
          className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
        >
          Add
        </button>
        </div>
    </div>
  </div>
}

export default EpisodeModal