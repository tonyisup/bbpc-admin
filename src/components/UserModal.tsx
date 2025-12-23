import { DispatchWithoutAction, FC, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserPlus, User, Mail } from "lucide-react";

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
      toast.success("User created successfully");
    },
    onError: (err) => {
      toast.error("Failed to create user: " + err.message);
    }
  });
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const handleAdd = () => {
    if (userName && userEmail) {
      addItem({ name: userName, email: userEmail })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <div className="p-2 rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Add New User</DialogTitle>
          </div>
          <DialogDescription>
            Create a new administrative user profile to manage system content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. John Doe"
              className="bg-card h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="bg-card h-11"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isLoading || !userName || !userEmail} className="px-8 shadow-md">
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserModal;
