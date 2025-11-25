import { NextPage } from "next";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mic2, Users, Film, Star, Calendar } from "lucide-react";
import Link from "next/link";
import AssignmentCard from "../components/Assignment/AssignmentCard";
import ExtraCard from "../components/Extra/ExtraCard";
import MovieCard from "../components/MovieCard";

import GuessesGraph from "../components/Dashboard/GuessesGraph";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, { enabled: !!session });
  const { data: guessesStats } = trpc.dashboard.getGuessesStats.useQuery(undefined, { enabled: !!session });

  // If not logged in, the Layout component centers this content
  if (!session) {
    return (
      <>
        <Head>
          <title>BBPC Admin - Login</title>
        </Head>
        <Card className="w-[350px] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>BBPC Admin</CardTitle>
            <CardDescription>Sign in to manage the podcast</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={() => signIn()} size="lg">
              Sign In with Provider
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // If logged in, the Layout component puts this in the main area
  return (
    <>
      <Head>
        <title>BBPC Admin - Dashboard</title>
      </Head>

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name}.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/episode">
            <Card className="hover:bg-muted/50 transition cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Episodes
                </CardTitle>
                <Mic2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.counts.episodes ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  View and edit podcast episodes
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/user">
            <Card className="hover:bg-muted/50 transition cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.counts.users ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Manage admin users
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Movies
              </CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.counts.movies ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Movies in the database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.counts.reviews ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Reviews submitted
              </p>
            </CardContent>
          </Card>
        </div>

        {guessesStats && <GuessesGraph data={guessesStats} className="col-span-7" />}

        {/* Latest Episode */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Latest Episode</CardTitle>
            <CardDescription>
              The most recent episode added to the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.latestEpisode ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Episode {stats.latestEpisode.number}: {stats.latestEpisode.title}</span>
                  {stats.latestEpisode.date && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(stats.latestEpisode.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stats.latestEpisode.description || "No description available."}
                </p>
                <div className="flex gap-2 justify-around">
                  {stats.latestEpisode.assignments?.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
                <div className="flex gap-2 justify-around">
                  {stats.latestEpisode.extras?.map((extra) => (
                    <ExtraCard key={extra.id} extra={extra} />
                  ))}
                </div>
                <div className="mt-2">
                  <Link href={`/episode/${stats.latestEpisode.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No episodes found.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Episode */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Episode</CardTitle>
            <CardDescription>
              The next scheduled episode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEpisode ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Episode {stats.upcomingEpisode.number}: {stats.upcomingEpisode.title}</span>
                  {stats.upcomingEpisode.date && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(stats.upcomingEpisode.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stats.upcomingEpisode.description || "No description available."}
                </p>
                <div className="flex gap-2 justify-around">
                  {stats.upcomingEpisode.assignments?.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
                <div className="flex gap-2 justify-around">
                  {stats.upcomingEpisode.extras?.map((extra) => (
                    <ExtraCard key={extra.id} extra={extra} />
                  ))}
                </div>
                <div className="mt-2">
                  <Link href={`/episode/${stats.upcomingEpisode.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming episodes found.</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Syllabus Additions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Syllabus Additions</CardTitle>
            <CardDescription>
              Latest movies added to user syllabuses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 flex gap-2">
              {stats?.latestSyllabus.map((item) => (
                <div key={item.id} className="flex-1 flex flex-col items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <MovieCard movie={item.Movie} showTitle={false} />
                  <span className="text-xs text-muted-foreground">{item.User.name || "Unknown User"}</span>
                </div>
              ))}
              {(!stats?.latestSyllabus || stats.latestSyllabus.length === 0) && (
                <p className="text-sm text-muted-foreground">No syllabus items found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default Home;
