import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, Star } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import RatingModal from "../../components/Rating/RatingModal";
import { Rating } from "@prisma/client";

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

const RatingsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: ratings, isLoading, refetch } = trpc.rating.getAll.useQuery();
  const removeMutation = trpc.rating.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Rating | null>(null);

  const handleEdit = (rating: Rating) => {
    setEditingItem(rating);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this rating?")) {
      removeMutation.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Ratings - BBPC Admin</title>
      </Head>

      <RatingModal
        open={modalOpen}
        setOpen={setModalOpen}
        refreshItems={refetch}
        editingItem={editingItem}
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ratings</h2>
            <p className="text-muted-foreground">Manage movie and show rating options.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rating
          </Button>
        </div>

        <div className="rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Value</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Icon/Sound</TableHead>
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

              {!isLoading && ratings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No ratings found.
                  </TableCell>
                </TableRow>
              )}

              {ratings?.map((rating) => (
                <TableRow key={rating.id} className="group">
                  <TableCell className="font-bold text-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {rating.value}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{rating.name}</TableCell>
                  <TableCell>{rating.category || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{rating.icon ? "Icon: ✅" : "Icon: ❌"}</span>
                      <span>{rating.sound ? "Sound: ✅" : "Sound: ❌"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rating)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(rating.id)}
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

export default RatingsPage;
