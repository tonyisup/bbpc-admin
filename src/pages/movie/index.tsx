import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useState, useMemo } from "react";
import { Trash2, Search, Plus, Film, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Image from "next/image";
import Link from "next/link";

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

const MoviesPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [existingFilter, setExistingFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'title',
    direction: 'asc'
  });

  const { data: existingMovies, isLoading: loadingExisting, refetch } = trpc.movie.getAll.useQuery();
  const { data: searchResults, isLoading: loadingSearch } = trpc.movie.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedMovies = useMemo(() => {
    if (!existingMovies) return [];

    let items = existingMovies.filter(movie =>
      movie.title.toLowerCase().includes(existingFilter.toLowerCase())
    );

    if (sortConfig.key && sortConfig.direction) {
      items.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'reviews') {
          aValue = a._count?.reviews || 0;
          bValue = b._count?.reviews || 0;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return items;
  }, [existingMovies, existingFilter, sortConfig]);

  const addMutation = trpc.movie.add.useMutation({
    onSuccess: () => {
      refetch();
      setSearchTerm("");
    },
  });

  const removeMutation = trpc.movie.remove.useMutation({
    // Error handling since movies might be linked to assignments/reviews
    onError: (err) => {
      alert("Failed to delete movie: " + err.message);
    },
    onSettled: () => refetch(),
  });

  const handleAdd = (result: any) => {
    addMutation.mutate({
      title: result.title,
      year: result.release_date ? new Date(result.release_date).getFullYear() : 0,
      poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : "",
      url: `https://www.themoviedb.org/movie/${result.id}`,
    });
  };

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to delete this movie? This might fail if it's linked to episodes or reviews.")) {
      removeMutation.mutate({ id });
    }
  };

  return (
    <>
      <Head>
        <title>Movies - BBPC Admin</title>
      </Head>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Movies</h2>
          <p className="text-muted-foreground">Manage movies in the database.</p>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col gap-4 p-6 rounded-lg border bg-card shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" /> Search & Add from TMDB
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search for a movie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loadingSearch && <p className="text-sm text-muted-foreground">Searching...</p>}

          {searchResults && searchResults.results && searchResults.results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
              {searchResults.results.map((result: any) => (
                <div key={result.id} className="flex flex-col gap-2 p-2 border rounded-md hover:bg-muted transition group relative">
                  <a
                    href={`https://www.themoviedb.org/movie/${result.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden rounded-md">
                      {result.poster_path ? (
                        <Image
                          unoptimized
                          src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
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
                  </a>
                  <div className="flex flex-col text-center">
                    <span className="text-sm font-bold line-clamp-1">{result.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {result.release_date ? new Date(result.release_date).getFullYear() : "N/A"}
                    </span>
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

        {/* Existing Movies */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Existing Movies</h3>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by title..."
                value={existingFilter}
                onChange={(e) => setExistingFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Poster</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortConfig.key === 'title' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center gap-1">
                      Year
                      {sortConfig.key === 'year' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('reviews')}
                  >
                    <div className="flex items-center gap-1">
                      Reviews
                      {sortConfig.key === 'reviews' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingExisting && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}

                {!loadingExisting && (sortedMovies.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      {existingFilter ? `No movies matching "${existingFilter}"` : "No movies found in database."}
                    </TableCell>
                  </TableRow>
                )}

                {sortedMovies.map((movie) => (
                  <TableRow key={movie.id} className="group">
                    <TableCell>
                      {movie.poster && (
                        <a
                          href={movie.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-80 transition-opacity block"
                        >
                          <div className="w-12 h-18 relative aspect-[2/3] rounded overflow-hidden shadow-sm">
                            <Image
                              unoptimized
                              src={movie.poster}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/movie/${movie.id}`} className="hover:underline">
                        {movie.title}
                      </Link>
                    </TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell>{movie._count?.reviews || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemove(movie.id)}
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

export default MoviesPage;
