import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
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
import GamblingTypeModal from "../../components/Game/GamblingTypeModal";
import { GamePointType, GameType, GamblingType } from "@prisma/client";

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

const GameManagementPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const { data: gameTypes, isLoading: loadingGT, refetch: refetchGT } = trpc.game.getGameTypes.useQuery();
  const { data: pointTypes, isLoading: loadingPT, refetch: refetchPT } = trpc.game.getAllGamePointTypes.useQuery();
  const { data: gamblingTypes, isLoading: loadingGamblingTypes, refetch: refetchGamblingTypes } = trpc.gambling.getAllTypes.useQuery();

  const removeGT = trpc.game.removeGameType.useMutation({ onSuccess: () => refetchGT() });
  const removePT = trpc.game.removeGamePointType.useMutation({ onSuccess: () => refetchPT() });
  const removeGamblingType = trpc.gambling.deleteType.useMutation({ onSuccess: () => refetchGamblingTypes() });

  const [gtModalOpen, setGtModalOpen] = useState(false);
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [gamblingTypeModalOpen, setGamblingTypeModalOpen] = useState(false);
  const [editingGT, setEditingGT] = useState<GameType | null>(null);
  const [editingPT, setEditingPT] = useState<GamePointType | null>(null);
  const [editingGamblingType, setEditingGamblingType] = useState<GamblingType | null>(null);

  const handleEditGT = (item: GameType) => {
    setEditingGT(item);
    setGtModalOpen(true);
  };

  const handleEditPT = (item: GamePointType) => {
    setEditingPT(item);
    setPtModalOpen(true);
  };

  const handleEditGamblingType = (item: GamblingType) => {
    setEditingGamblingType(item);
    setGamblingTypeModalOpen(true);
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

  const handleRemoveGamblingType = (id: string) => {
    if (confirm("Are you sure you want to delete this gambling type?")) {
      removeGamblingType.mutate({ id });
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

      <GamblingTypeModal
        open={gamblingTypeModalOpen}
        setOpen={setGamblingTypeModalOpen}
        refreshItems={refetchGamblingTypes}
        editingItem={editingGamblingType}
      />

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Game Mechanics</h2>
          <p className="text-muted-foreground">Configure game types and point rewards.</p>
        </div>

        <Tabs defaultValue="game-types" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="game-types">Game Types</TabsTrigger>
            <TabsTrigger value="point-types">Point Types</TabsTrigger>
            <TabsTrigger value="gambling-types">Gambling Types</TabsTrigger>
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
                        <TableCell className="text-sm">{gameTypes?.find(g => g.id === pt.gameTypeId)?.title || "Unknown"}</TableCell>
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

          <TabsContent value="gambling-types" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingGamblingType(null); setGamblingTypeModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Gambling Type
              </Button>
            </div>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Lookup ID</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingGamblingTypes ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : gamblingTypes?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No gambling types found.</TableCell></TableRow>
                  ) : (
                    gamblingTypes?.map(gt => (
                      <TableRow key={gt.id} className="group">
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-emerald-500" />
                            {gt.title}
                          </div>
                        </TableCell>
                        <TableCell><code className="bg-muted px-1 rounded">{gt.lookupId}</code></TableCell>
                        <TableCell className="font-semibold">{gt.multiplier}x</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${gt.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {gt.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEditGamblingType(gt)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveGamblingType(gt.id)}><Trash2 className="h-4 w-4" /></Button>
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
