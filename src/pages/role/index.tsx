import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, ShieldCheck, Shield } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import RoleModal from "../../components/Role/RoleModal";
import { Role } from "@prisma/client";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = await ssr.isAdmin(session?.user?.id || "");

  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}

const RolesPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: roles, isLoading, refetch } = trpc.role.getAll.useQuery();
  const removeMutation = trpc.role.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Role | null>(null);

  const handleEdit = (role: Role) => {
    setEditingItem(role);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleRemove = (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      removeMutation.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Roles - BBPC Admin</title>
      </Head>

      <RoleModal
        open={modalOpen}
        setOpen={setModalOpen}
        refreshItems={refetch}
        editingItem={editingItem}
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
            <p className="text-muted-foreground">Manage user roles and permissions.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>

        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && roles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No roles found.
                  </TableCell>
                </TableRow>
              )}

              {roles?.map((role) => (
                <TableRow key={role.id} className="group">
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2">
                      {role.admin ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    {role.admin ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold uppercase tracking-wider">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs bg-muted px-2 py-1 rounded font-semibold uppercase tracking-wider">
                        Member
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default RolesPage;
