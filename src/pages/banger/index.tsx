import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, Music } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import BangerModal from "../../components/Banger/BangerModal";
import { Banger } from "@prisma/client";

export async function getServerSideProps(context: GetServerSidePropsContext) {
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

const BangersPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: bangers, isLoading, refetch } = trpc.banger.getAll.useQuery();
  const removeMutation = trpc.banger.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Banger | null>(null);

  const handleEdit = (banger: Banger) => {
    setEditingItem(banger);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this banger?")) {
      removeMutation.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Bangers - BBPC Admin</title>
      </Head>

      <BangerModal
        open={modalOpen}
        setOpen={setModalOpen}
        refreshItems={refetch}
        editingItem={editingItem}
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bangers</h2>
            <p className="text-muted-foreground">Manage the podcast song collection.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Banger
          </Button>
        </div>

        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Episode</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && bangers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No bangers found.
                  </TableCell>
                </TableRow>
              )}

              {bangers?.map((banger: any) => (
                <TableRow key={banger.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-pink-500" />
                      <a href={banger.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {banger.title}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{banger.artist}</TableCell>
                  <TableCell>
                    {banger.episode ? (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Ep {banger.episode.number}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{banger.user?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(banger)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(banger.id)}
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

export default BangersPage;
