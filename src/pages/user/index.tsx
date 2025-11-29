import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import { DispatchWithoutAction, useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import UserModal from "../../components/UserModal";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export async function getServerSideProps(context: any) {
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
  const [filteredItems, setFilteredItems] = useState(items || [])
  const { mutate: removeItem } = trpc.user.remove.useMutation({
    onSuccess: () => {
      refresh()
    }
  })
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (items) {
      setFilteredItems(items)
    }
  }, [items])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = items?.filter(item =>
      item.name?.toLowerCase().includes(e.target.value.toLowerCase()) ||
      item.email?.toLowerCase().includes(e.target.value.toLowerCase())
    )
    setFilteredItems(filtered || [])
  }

  return (
    <>
      <UserModal open={modalOpen} setOpen={setModalOpen} refreshItems={refresh} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage admin users and permissions.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="flex items-center py-2">
          <Input
            placeholder="Search users..."
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3} className="text-center h-24">Loading...</TableCell></TableRow>}

              {!isLoading && filteredItems?.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No users found.</TableCell></TableRow>
              )}

              {filteredItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Link href={`/user/${encodeURIComponent(item.id)}`} className="hover:underline">
                      {item.email}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem({ id: item.id })} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default UsersPage;
