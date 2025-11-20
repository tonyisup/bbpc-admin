import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface UserModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  refreshItems: DispatchWithoutAction
}

const UserModal: FC<UserModalProps> = ({ open, setOpen, refreshItems }) => {
  const { mutate: addItem, isLoading } = trpc.user.add.useMutation({
    onSuccess: () => {
      refreshItems()
      setOpen(false)
      setUserName("")
      setUserEmail("")
    }
  });
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const handleAdd = () => {
    if(userName && userEmail) {
        addItem({ name: userName, email: userEmail })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)}>
             Cancel
           </Button>
           <Button onClick={handleAdd} disabled={isLoading}>
             {isLoading ? "Adding..." : "Add User"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserModal
