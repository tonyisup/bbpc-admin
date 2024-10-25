import { type Dispatch, type SetStateAction, type FC } from "react"
import { trpc } from "../utils/trpc"

interface RoleSelectProps {
  setRoleId: Dispatch<SetStateAction<number>> 
}
const RoleSelect: FC<RoleSelectProps> = ({
  setRoleId: setRoleId,
}) => {
  const { data: roles } = trpc.role.getAll.useQuery()
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    setRoleId(Number(e.target.value))
  }
  return <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
    title="Select a role"
    onChange={handleChange}        
  >
    <option value={0}>Select a role</option>
    {roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
  </select>
}
export default RoleSelect