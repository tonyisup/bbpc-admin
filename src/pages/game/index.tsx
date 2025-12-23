import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, Gamepad2, Coins } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import GameTypeModal from "../../components/Game/GameTypeModal";
import GamePointTypeModal from "../../components/Game/GamePointTypeModal";
import { GamePointType, GameType } from "@prisma/client";

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

const GameManagementPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: gameTypes, isLoading: loadingGT, refetch: refetchGT } = trpc.game.getGameTypes.useQuery();
  const { data: pointTypes, isLoading: loadingPT, refetch: refetchPT } = trpc.game.getAllGamePointTypes.useQuery();

  const removeGT = trpc.game.removeGameType.useMutation({ onSuccess: () => refetchGT() });
  const removePT = trpc.game.removeGamePointType.useMutation({ onSuccess: () => refetchPT() });

  const [gtModalOpen, setGtModalOpen] = useState(false);
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [editingGT, setEditingGT] = useState<GameType | null>(null);
  const [editingPT, setEditingPT] = useState<GamePointType | null>(null);

  const handleEditGT = (item: GameType) => {
    setEditingGT(item);
    setGtModalOpen(true);
  };

  const handleEditPT = (item: GamePointType) => {
    setEditingPT(item);
    setPtModalOpen(true);
  };

  const handleRemoveGT = (id: number) => {
    if (confirm("Are you sure? This will delete the game type and its point types.")) {
      removeGT.mutate({ id });
    }
  };

  const handleRemovePT = (id: number) => {
    if (confirm("Are you sure?")) {
      removePT.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Game Mechanics - BBPC Admin</title>
      </Head>

      <GameTypeModal
        open={gtModalOpen}
        setOpen={setGtModalOpen}
        refreshItems={() => { refetchGT(); refetchPT(); }}
        editingItem={editingGT}
      />

      <GamePointTypeModal
        open={ptModalOpen}
        setOpen={setPtModalOpen}
        refreshItems={refetchPT}
        editingItem={editingPT}
      />

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Game Mechanics</h2>
          <p className="text-muted-foreground">Configure game types and point rewards.</p>
        </div>

        <Tabs defaultValue="game-types" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="game-types">Game Types</TabsTrigger>
            <TabsTrigger value="point-types">Point Types</TabsTrigger>
          </TabsList>

          <TabsContent value="game-types" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingGT(null); setGtModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Game Type
              </Button>
            </div>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Lookup ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingGT ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : gameTypes?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No game types found.</TableCell></TableRow>
                  ) : (
                    gameTypes?.map(gt => (
                      <TableRow key={gt.id} className="group">
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4 text-indigo-500" />
                            {gt.title}
                          </div>
                        </TableCell>
                        <TableCell><code className="bg-muted px-1 rounded">{gt.lookupID}</code></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{gt.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEditGT(gt)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveGT(gt.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="point-types" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingPT(null); setPtModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Point Type
              </Button>
            </div>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Game Type</TableHead>
                    <TableHead>Lookup ID</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPT ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : pointTypes?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No point types found.</TableCell></TableRow>
                  ) : (
                    pointTypes?.map(pt => (
                      <TableRow key={pt.id} className="group">
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-amber-500" />
                            {pt.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{gameTypes?.find(g => g.id === pt.gameTypeId)?.title || pt.gameTypeId}</TableCell>
                        <TableCell><code className="bg-muted px-1 rounded">{pt.lookupID}</code></TableCell>
                        <TableCell className="font-semibold text-lg">{pt.points > 0 ? `+${pt.points}` : pt.points}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPT(pt)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemovePT(pt.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default GameManagementPage;
