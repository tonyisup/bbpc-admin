import { type Dispatch, type SetStateAction, type FC } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trpc } from "../utils/trpc"

interface RoleSelectProps {
  setRoleId: Dispatch<SetStateAction<number>> 
}
const RoleSelect: FC<RoleSelectProps> = ({
  setRoleId: setRoleId,
}) => {
  const { data: roles } = trpc.role.getAll.useQuery()
  const handleChange = function(value: string) {
    setRoleId(Number(value))
  }
  return <Select onValueChange={handleChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
      {roles?.map((role) => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}
    </SelectContent>
  </Select>
}
export default RoleSelect