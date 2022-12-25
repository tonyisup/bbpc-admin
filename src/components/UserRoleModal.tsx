import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";
import RoleSelect from "./RoleSelect";

interface UserRoleModalProps {
  userId: string,
  setModalOpen: Dispatch<SetStateAction<boolean>>
  refresh: DispatchWithoutAction
}

const UserRoleModal: FC<UserRoleModalProps> = ({
  userId: userId,
  setModalOpen, 
  refresh: refresh,
}) => {
  const { data: user } = trpc.user.get.useQuery({ id: userId })
  const { mutate: addUserRole } = trpc.user.addRole.useMutation({
    onSuccess: () => {
      refresh()
    }
  });
  const [roleId, setRoleId] = useState(0)
  const addRoleToUser = function() {
    addUserRole({
      userId: userId,
      roleId: roleId
    })
  }
  return <div className=" text-white absolute inset-0 flex items-center justify-center bg-black/75">
    <div className="p-3 space-y-4 bg-gray-800">
      <h3 className="text-xl font-medium">New User Role Assignment</h3>
      <div className="text-gray-300">
        <p>Assigning role ({roleId}) to user: {user?.name}</p>
      </div>
      <RoleSelect setRoleId={setRoleId}/>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setModalOpen(false)}
          className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            addRoleToUser()
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

export default UserRoleModal