import { GetServerSidePropsContext, InferGetServerSidePropsType, type NextPage } from "next";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import { DispatchWithoutAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Search, UserCheck, ShieldAlert, Filter, X } from "lucide-react";
import UserModal from "../../components/UserModal";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../lib/utils";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = await ssr.isAdmin(session?.user?.id || "");

  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  return {
    props: {
      session
    }
  }
}

const UsersPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const refresh: DispatchWithoutAction = () => refetchItems()
  const { data: items, isLoading, refetch: refetchItems } = trpc.user.getAll.useQuery()
  const { data: roles } = trpc.role.getAll.useQuery()

  const [filteredItems, setFilteredItems] = useState(items || [])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState<string>("all")

  const { mutate: removeItem } = trpc.user.remove.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("User removed successfully");
    },
    onError: (err) => {
      toast.error("Failed to remove user: " + err.message);
    }
  })
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (items) {
      let filtered = items.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      if (selectedRoleId !== "all") {
        filtered = filtered.filter(item =>
          item.roles.some(ur => ur.roleId.toString() === selectedRoleId)
        )
      }

      setFilteredItems(filtered)
    }
  }, [items, searchQuery, selectedRoleId])

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  }

  const activeRoleName = roles?.find(r => r.id.toString() === selectedRoleId)?.name;

  return (
    <>
      <UserModal open={modalOpen} setOpen={setModalOpen} refreshItems={refresh} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage administrative users and their system permissions.</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoleId !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoleId("all")}
                className="h-9 px-2 text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {selectedRoleId !== "all" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Filtered by:</span>
            <Badge variant="secondary" className="pl-1 pr-1.5 py-0.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {filteredItems.length}
              </span>
              {activeRoleName}
              <button type="button" onClick={() => setSelectedRoleId("all")} className="hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-10 w-48 animate-pulse bg-muted rounded-md" /></TableCell>
                    <TableCell><div className="h-6 w-24 animate-pulse bg-muted rounded-full" /></TableCell>
                    <TableCell className="text-right"><div className="ml-auto h-8 w-8 animate-pulse bg-muted rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-48">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No users found matching your search.</p>
                      {(searchQuery || selectedRoleId !== "all") && (
                        <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedRoleId("all"); }}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <Link href={`/user/${encodeURIComponent(item.id)}`} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={item.image ?? ""} alt={item.name ?? "User"} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {getInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate text-foreground group-hover:text-primary transition-colors">
                            {item.name || "Unnamed User"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground font-normal">
                            {item.email}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {item.roles && item.roles.length > 0 ? (
                          item.roles.map((ur) => (
                            <button
                              type="button"
                              key={ur.role.id}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedRoleId(ur.role.id.toString());
                              }}
                              className="group/badge active:scale-95 transition-transform"
                            >
                              <Badge
                                variant={ur.role.admin ? "destructive" : "secondary"}
                                className={cn(
                                  "px-2 py-0 border-none flex items-center gap-1 cursor-pointer transition-all",
                                  selectedRoleId === ur.role.id.toString()
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                    : "hover:opacity-80 group-hover/badge:translate-y-[-1px]"
                                )}
                              >
                                {ur.role.admin ? <ShieldAlert className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                {ur.role.name}
                              </Badge>
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Guest</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                            removeItem({ id: item.id })
                          }
                        }}
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};

export default UsersPage;
