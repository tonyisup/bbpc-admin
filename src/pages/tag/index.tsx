import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, Tag as TagIcon, Vote, Coins, Check } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import TagModal from "../../components/Tag/TagModal";
import { Tag } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";

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

const TagManagementPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: tags, isLoading: loadingTags, refetch: refetchTags } = trpc.tag.getTags.useQuery();
  const { data: votes, isLoading: loadingVotes, refetch: refetchVotes } = trpc.tag.getTagVotes.useQuery({});

  const removeTag = trpc.tag.removeTag.useMutation({ onSuccess: () => refetchTags() });
  const removeVote = trpc.tag.removeTagVote.useMutation({ onSuccess: () => refetchVotes() });
  const applyPoints = trpc.tag.applyTagVotePoints.useMutation({ onSuccess: () => refetchVotes() });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);

  const handleEdit = (tag: Tag) => {
    setEditingItem(tag);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleRemoveTag = (id: string) => {
    if (confirm("Are you sure?")) {
      removeTag.mutate({ id });
    }
  };

  const handleRemoveVote = (id: string) => {
    if (confirm("Are you sure?")) {
      removeVote.mutate({ id });
    }
  };

  const handleApplyPoints = (id: string) => {
    if (confirm("Apply points for this vote?")) {
      applyPoints.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Tags - BBPC Admin</title>
      </Head>

      <TagModal
        open={modalOpen}
        setOpen={setModalOpen}
        refreshItems={refetchTags}
        editingItem={editingItem}
      />

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tags & Votes</h2>
          <p className="text-muted-foreground">Manage movie tags and user votes content.</p>
        </div>

        <Tabs defaultValue="tags" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="votes">Tag Votes</TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Tag
              </Button>
            </div>
            <div className="rounded-md border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTags ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : tags?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No tags found.</TableCell></TableRow>
                  ) : (
                    tags?.map(tag => (
                      <TableRow key={tag.id} className="group">
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-cyan-500" />
                            {tag.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tag.description || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(tag)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveTag(tag.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="votes" className="mt-6">
            <div className="rounded-md border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>User Tag</TableHead>
                    <TableHead>TMDB ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingVotes ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : votes?.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No votes found.</TableCell></TableRow>
                  ) : (
                    votes?.map(vote => (
                      <TableRow key={vote.id} className="group">
                        <TableCell>
                          {vote.user ? (
                            <Link href={`/user/${vote.user.id}`}>
                              <div className="flex items-center gap-2 group/user cursor-pointer">
                                {vote.user.image ? (
                                  <Image
                                    src={vote.user.image}
                                    alt={vote.user.name || "User"}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 rounded-full"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="text-sm font-medium group-hover/user:text-primary transition-colors">
                                  {vote.user.name || "Unknown"}
                                </span>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="h-4 w-4" />
                              </div>
                              <span className="text-sm">Unknown</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Vote className="h-4 w-4 text-purple-500" />
                            {vote.tag}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{vote.tmdbId}</TableCell>
                        <TableCell>
                          {vote.isTag ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Is Tag</span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Not Tag</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(vote.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                            {vote.pointId ? (
                              <div className="flex items-center justify-center h-10 w-10 text-green-500" title="Points Applied">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApplyPoints(vote.id)}
                                title="Apply Points"
                              >
                                <Coins className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveVote(vote.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default TagManagementPage;
