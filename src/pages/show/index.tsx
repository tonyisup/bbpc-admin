import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState } from "react";
import { Trash2, Search, Plus, Film } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Image from "next/image";

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

const ShowsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: existingShows, isLoading: loadingExisting, refetch } = trpc.show.getAll.useQuery();
  const { data: searchResults, isLoading: loadingSearch } = trpc.show.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  const addMutation = trpc.show.add.useMutation({
    onSuccess: () => {
      refetch();
      setSearchTerm("");
    },
  });

  const removeMutation = trpc.show.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const handleAdd = (result: any) => {
    addMutation.mutate({
      title: result.title,
      year: result.year,
      poster: result.poster,
      url: result.url,
    });
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this show?")) {
      removeMutation.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Shows - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Shows</h2>
          <p className="text-muted-foreground">Manage TV shows and series in the database.</p>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col gap-4 p-6 rounded-lg border bg-card shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" /> Search & Add from TMDB
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search for a show..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loadingSearch && <p className="text-sm text-muted-foreground">Searching...</p>}

          {searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
              {searchResults.map((result: any) => (
                <div key={result.url} className="flex flex-col gap-2 p-2 border rounded-md hover:bg-muted transition group relative">
                  <div className="aspect-[2/3] relative overflow-hidden rounded-md">
                    {result.poster ? (
                      <Image
                        unoptimized
                        src={result.poster}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold line-clamp-1">{result.title}</span>
                    <span className="text-xs text-muted-foreground">{result.year}</span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-1"
                    onClick={() => handleAdd(result)}
                    disabled={addMutation.isLoading}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Shows */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold">Existing Shows</h3>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Poster</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingExisting && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}

                {!loadingExisting && existingShows?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No shows found in database.
                    </TableCell>
                  </TableRow>
                )}

                {existingShows?.map((show) => (
                  <TableRow key={show.id} className="group">
                    <TableCell>
                      {show.poster && (
                        <div className="w-12 h-18 relative aspect-[2/3] rounded overflow-hidden shadow-sm">
                          <Image
                            unoptimized
                            src={show.poster}
                            alt={show.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{show.title}</TableCell>
                    <TableCell>{show.year}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemove(show.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowsPage;
