import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ChevronLeft, Calendar, Mic2, Link2, FileText, Settings2, PlayCircle, RefreshCcw, Film } from "lucide-react";
import EpisodeAssignments from "../../components/Assignment/EpisodeAssignments";
import EpisodeExtras from "../../components/Extra/EpisodeExtras";
import { trpc } from "../../utils/trpc";
import EpisodeLinks from "../../components/Link/EpisodeLinks";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import EpisodeAudioMessages from "../../components/Episode/EpisodeAudioMessages";
import EpisodeEditor from "../../components/Episode/EpisodeEditor";
import EpisodePlainView from "../../components/Episode/EpisodePlainView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadDropzone } from "../../utils/uploadthing";
import { toast } from "sonner";

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

const EpisodePage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ session }) => {
  const { query } = useRouter();
  const id = typeof query.id === 'string' ? query.id : undefined;
  const [activeTab, setActiveTab] = useState("general");

  const { data: episode, refetch, isFetching } = trpc.episode.get.useQuery({
    id: id!
  }, {
    enabled: !!id
  });

  const utils = trpc.useContext();
  const addAudioMessage = trpc.episode.addAudioMessage.useMutation({
    onSuccess: () => {
      utils.episode.getAudioMessages.invalidate({ episodeId: id });
      toast.success("Audio message added successfully");
    },
    onError: (err) => {
      toast.error(`Failed to add audio message: ${err.message}`);
    }
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'recording': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'next': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <>
      <Head>
        <title>{episode ? `Episode ${episode.number} - ${episode.title} | Admin` : 'Loading Episode... | Admin'}</title>
      </Head>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full py-8 px-4">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/episode">
              <ChevronLeft className="h-4 w-4" />
              Back to Episodes
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-8 rounded-2xl border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Mic2 className="h-48 w-48" />
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-2 py-0 h-6 font-black text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                Ep. {episode?.number}
              </Badge>
              <Badge className={`px-2 py-0 h-6 font-bold text-[10px] uppercase tracking-wider border ${getStatusColor(episode?.status ?? null)}`}>
                {episode?.status || 'Draft'}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{episode?.title || "Loading Episode..."}</h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/60" />
                {episode?.date ? new Date(episode.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No date set'}
              </div>
              {episode?.recording && (
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary/60" />
                  <span className="truncate max-w-[200px]">{episode.recording}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground mb-8">
            <TabsTrigger value="general" className="rounded-lg px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="movies" className="rounded-lg px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Film className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments & Extras</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-lg px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Links & Audio</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg px-6 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Show Notes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0 focus-visible:outline-none">
            {episode && <EpisodeEditor episode={episode} onEpisodeUpdated={refetch} />}
          </TabsContent>

          <TabsContent value="movies" className="mt-0 space-y-8 focus-visible:outline-none">
            {episode && (
              <>
                <div className="space-y-6">
                  <EpisodeAssignments episode={episode} />
                  <Separator className="my-8" />
                  <EpisodeExtras episode={episode} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-0 space-y-8 focus-visible:outline-none">
            {episode && (
              <div className="grid grid-cols-1 gap-8">
                <EpisodeLinks episode={episode} />
                <Separator className="my-4" />
                <div className="px-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Mic2 className="h-5 w-5 text-primary" />
                      Audio Messages
                    </h2>
                  </div>

                  <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 transition-colors hover:border-primary/40 group">
                    <UploadDropzone
                      endpoint="audioUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0] && id) {
                          addAudioMessage.mutate({
                            episodeId: id,
                            url: res[0].url,
                            fileKey: res[0].key
                          });
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Upload failed: ${error.message}`);
                      }}
                      content={{
                        label: "Drag & Drop Audio Message",
                        allowedContent: "Audio (max 4MB)"
                      }}
                      appearance={{
                        button: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium",
                        container: "flex flex-col items-center justify-center gap-2 py-8",
                        label: "text-muted-foreground font-medium group-hover:text-foreground transition-colors",
                        allowedContent: "text-xs text-muted-foreground/60"
                      }}
                    />
                  </div>

                  <Separator className="my-4 opacity-50" />
                  <EpisodeAudioMessages episode={episode} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
            {episode && <EpisodePlainView episodeId={episode.id} episodeNumber={episode.number} />}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default EpisodePage;