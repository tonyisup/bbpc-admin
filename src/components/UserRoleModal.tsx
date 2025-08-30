import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
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
        <Button
          onClick={() => setModalOpen(false)}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            addRoleToUser()
            setModalOpen(false)
          }}
        >
          Add
        </Button>
        </div>
    </div>
  </div>
}

export default UserRoleModal