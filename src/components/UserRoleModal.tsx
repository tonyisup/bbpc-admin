import { Dispatch, FC, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "../utils/trpc";
import RoleSelect from "./RoleSelect";

interface UserRoleModalProps {
  userId: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  refresh: () => void;
}

const UserRoleModal: FC<UserRoleModalProps> = ({
  userId,
  isOpen,
  setIsOpen,
  refresh,
}) => {
  const { data: user } = trpc.user.get.useQuery({ id: userId });
  const { mutate: addUserRole } = trpc.user.addRole.useMutation({
    onSuccess: () => {
      refresh();
      setIsOpen(false);
    },
  });
  const [roleId, setRoleId] = useState(0);
  const addRoleToUser = function () {
    addUserRole({
      userId: userId,
      roleId: roleId,
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New User Role Assignment</DialogTitle>
        </DialogHeader>
        <div className="text-gray-300">
          <p>
            Assigning role ({roleId}) to user: {user?.name}
          </p>
        </div>
        <RoleSelect setRoleId={setRoleId} />
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setIsOpen(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={addRoleToUser}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleModal;