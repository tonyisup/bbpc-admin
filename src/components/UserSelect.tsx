import { User } from "@prisma/client";
import { Dispatch, SetStateAction, FC, useState, useEffect } from "react";
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
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    setUserId(e.target.value);
  }
  useEffect(() => {
    if (user)
      selectUser(user);
  }, [user]);
  return (
    <div className="w-full flex justify-center">
      <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        onChange={handleChange}        
      >
				<option value="">Select a user</option>
        {users?.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
      </select>
    </div>
  );
};

export default UserSelect;