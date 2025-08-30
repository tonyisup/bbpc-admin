import { User } from "@prisma/client";
import { Dispatch, SetStateAction, FC, useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "../utils/trpc";

interface UserSelectProps {
  selectUser: Dispatch<SetStateAction<User | null>>;
}

const UserSelect: FC<UserSelectProps> = ({
  selectUser: selectUser,
}) => {
  const [userId, setUserId] = useState<string>("");
  const { data: users } = trpc.user.getAll.useQuery();
  const { data: user } = trpc.user.get.useQuery({ id: userId });
  const handleChange = function(value: string) {
    setUserId(value);
  }
  useEffect(() => {
    if (user)
      selectUser(user);
  }, [user]);
  return (
    <div className="w-full flex justify-center">
      <Select onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users?.map((user) => <SelectItem key={user.id} value={user.id}>{user.name} - {user.email}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelect;