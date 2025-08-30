import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <Input
          title="name"
          type="text"
          name="name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <Input
          title="email"
          type="email"
          name="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => setModalOpen(false)}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            addItem({ name: userName, email: userEmail })
            setModalOpen(false)
          }}
        >
          Add
        </Button>
        </div>
    </div>
  </div>
}

export default EpisodeModal