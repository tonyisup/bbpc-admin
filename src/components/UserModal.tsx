
import { Dispatch, FC, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "../utils/trpc";

interface UserModalProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  refreshItems: () => void;
}

const UserModal: FC<UserModalProps> = ({ isOpen, setIsOpen, refreshItems }) => {
  const { mutate: addItem } = trpc.user.add.useMutation({
    onSuccess: () => {
      refreshItems();
      setIsOpen(false);
    },
  });
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const handleAddUser = () => {
    addItem({ name: userName, email: userEmail });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>
        <div>
          <label htmlFor="name">Name</label>
          <Input
            id="name"
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
            id="email"
            title="email"
            type="email"
            name="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setIsOpen(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddUser}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;