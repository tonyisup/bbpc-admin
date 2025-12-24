import { Dispatch, DispatchWithoutAction, FC, SetStateAction, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Shield, UserPlus, Info } from "lucide-react";

interface UserRoleModalProps {
  userId: string,
  setModalOpen: Dispatch<SetStateAction<boolean>>
  refresh: DispatchWithoutAction
}

const UserRoleModal: FC<UserRoleModalProps> = ({
  userId,
  setModalOpen,
  refresh,
}) => {
  const { data: user, isLoading: userLoading, error: userError } = trpc.user.get.useQuery({ id: userId });
  const { data: roles } = trpc.role.getAll.useQuery();

  const { mutate: addUserRole, isLoading: isAdding } = trpc.user.addRole.useMutation({
    onSuccess: () => {
      refresh();
      setModalOpen(false);
      toast.success("Role assigned successfully");
    },
    onError: (err) => {
      toast.error("Failed to assign role: " + err.message);
    }
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const handleAddRole = () => {
    if (selectedRoleId) {
      const roleId = parseInt(selectedRoleId, 10);
      if (Number.isNaN(roleId)) {
        toast.error("Invalid role selected");
        return;
      }
      addUserRole({
        userId: userId,
        roleId: roleId
      });
    }
  };

  const selectedRole = roles?.find(r => r.id.toString() === selectedRoleId);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setModalOpen(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <div className="p-2 rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Assign Role</DialogTitle>
          </div>
          <DialogDescription>
            Grant new permissions to this user by assigning a specialized role.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* User Preview */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-muted-foreground/10" aria-live="polite">
            {userLoading ? (
              <div className="flex items-center gap-4 w-full">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ) : userError ? (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium p-2">
                <Info className="h-4 w-4" />
                <span>Failed to load user details</span>
              </div>
            ) : user ? (
              <>
                <Avatar className="h-12 w-12 border shadow-sm">
                  <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {user.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold truncate text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">User not found</div>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="role" className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Select Role
            </Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger id="role" className="w-full bg-card h-12">
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">{role.name}</span>
                      {role.admin && (
                        <span className="text-[10px] text-destructive font-black uppercase tracking-widest mt-0.5">Administrator</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRole && (
              <div className="mt-2 p-3 rounded-md bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Role Description</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedRole.description || "No description provided for this role."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddRole}
            disabled={!selectedRoleId || isAdding}
            className="px-8 shadow-md"
          >
            {isAdding ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleModal;