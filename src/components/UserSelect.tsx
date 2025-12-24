import { User } from "@prisma/client";
import { FC } from "react";
import { trpc } from "../utils/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserSelectProps {
  selectUser: (user: User | null) => void;
}

const UserSelect: FC<UserSelectProps> = ({ selectUser }) => {
  const { data: users } = trpc.user.getAll.useQuery();

  const handleValueChange = (userId: string) => {
    const selectedUser = users?.find(u => u.id === userId) || null;
    selectUser(selectedUser);
  };

  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a user" />
      </SelectTrigger>
      <SelectContent>
        {users?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.image ?? ""} />
                <AvatarFallback className="text-[8px]">{user.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.name || user.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserSelect;