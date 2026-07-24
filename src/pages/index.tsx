import { useBbpcAdminAuth } from "@/components/auth/BbpcAdminAuthContext";
import { type NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mic2, Users, Film, Star, Calendar } from "lucide-react";
import Link from "next/link";
import AssignmentCard from "../components/Assignment/AssignmentCard";
import ExtraCard from "../components/Extra/ExtraCard";
import MovieCard from "../components/MovieCard";

import GuessesGraph from "../components/Dashboard/GuessesGraph";
import { ConvexAdminDashboard } from "../components/Dashboard/ConvexAdminDashboard";
import { formatInstantLocal, formatPlainDate } from "@/lib/dates";
import { getAdminEpisodePath } from "@/lib/routes";

const Home: NextPage = () => {
  const {
    accountIssue,
    accountStatus,
    backend,
    refreshAccount,
    signIn,
    signOut,
    status,
    user,
  } = useBbpcAdminAuth();
  const { data: isSqlAdmin, isLoading: isSqlAdminLoading } =
    trpc.auth.isAdmin.useQuery(undefined, {
      enabled: backend === "sql" && user !== null,
    });
  const isAdmin =
    backend === "convex" ? user?.isAdmin === true : isSqlAdmin === true;
  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, {
    enabled: backend === "sql" && isAdmin,
  });
  const { data: guessesStats } = trpc.dashboard.getGuessesStats.useQuery(
    undefined,
    { enabled: backend === "sql" && isAdmin }
  );

  if (
    status === "loading" ||
    (backend === "convex" && accountStatus === "resolving")
  ) {
    return null;
  }

  if (!user) {
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
            <Button onClick={signIn} size="lg">
              Sign In with Provider
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (backend === "convex" && accountStatus !== "ready") {
    const message =
      accountIssue === "account-disabled"
        ? "This account is disabled."
        : accountIssue === "identity-conflict"
        ? "This sign-in is already linked to another BBPC account."
        : accountIssue === "linking-disabled"
        ? "Account linking is paused in this environment."
        : accountIssue === "stale-client"
        ? "This admin client is out of date."
        : "The BBPC account could not be resolved.";
    return (
      <Card className="w-[420px] max-w-[calc(100vw-2rem)] shadow-lg">
        <CardHeader>
          <CardTitle>Admin account needs attention</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={refreshAccount}>Try again</Button>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (backend === "sql" && isSqlAdminLoading) {
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Head>
          <title>
            {backend === "convex"
              ? "BBPC Admin - Access Required"
              : "BBPC Member Tools"}
          </title>
        </Head>
        <Card className="mx-auto mt-12 max-w-xl">
          <CardHeader>
            <CardTitle>
              {backend === "convex"
                ? "Administrator access required"
                : "Member Tools"}
            </CardTitle>
            <CardDescription>
              This account does not have administrator access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {backend === "sql" ? (
              <>
                <Button asChild>
                  <Link href="/lists">Open Ranked Lists</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/record?guest=true">Join the Recording Room</Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (backend === "convex") {
    return (
      <>
        <Head>
          <title>BBPC Admin - Dashboard</title>
        </Head>
        <ConvexAdminDashboard userName={user.name} />
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
          <p className="text-muted-foreground">Welcome back, {user.name}.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/episode">
            <Card className="cursor-pointer transition hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Episodes
                </CardTitle>
                <Mic2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.counts.episodes ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  View and edit podcast episodes
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/user">
            <Card className="cursor-pointer transition hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.counts.users ?? 0}
                </div>
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
              <div className="text-2xl font-bold">
                {stats?.counts.movies ?? 0}
              </div>
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
              <div className="text-2xl font-bold">
                {stats?.counts.reviews ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Reviews submitted</p>
            </CardContent>
          </Card>
        </div>

        {guessesStats && (
          <GuessesGraph data={guessesStats} className="col-span-7" />
        )}

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
                  <span className="text-lg font-semibold">
                    Episode {stats.latestEpisode.number}:{" "}
                    {stats.latestEpisode.title}
                  </span>
                  {stats.latestEpisode.date && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatPlainDate(stats.latestEpisode.date)}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {stats.latestEpisode.description ||
                    "No description available."}
                </p>
                <div className="flex justify-around gap-2">
                  {stats.latestEpisode.assignments?.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </div>
                <div className="flex justify-around gap-2">
                  {stats.latestEpisode.extras?.map((extra) => (
                    <ExtraCard key={extra.id} extra={extra} />
                  ))}
                </div>
                <div className="mt-2">
                  <Link
                    href={getAdminEpisodePath(
                      stats.latestEpisode.slug ?? stats.latestEpisode.id
                    )}
                  >
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No episodes found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Episode */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Episode</CardTitle>
            <CardDescription>The next scheduled episode.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEpisode ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    Episode {stats.upcomingEpisode.number}:{" "}
                    {stats.upcomingEpisode.title}
                  </span>
                  {stats.upcomingEpisode.date && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatPlainDate(stats.upcomingEpisode.date)}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {stats.upcomingEpisode.description ||
                    "No description available."}
                </p>
                <div className="flex justify-around gap-2">
                  {stats.upcomingEpisode.assignments?.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </div>
                <div className="flex justify-around gap-2">
                  {stats.upcomingEpisode.extras?.map((extra) => (
                    <ExtraCard key={extra.id} extra={extra} />
                  ))}
                </div>
                <div className="mt-2">
                  <Link
                    href={getAdminEpisodePath(
                      stats.upcomingEpisode.slug ?? stats.upcomingEpisode.id
                    )}
                  >
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming episodes found.
              </p>
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
            <div className="flex gap-2 space-y-4">
              {stats?.latestSyllabus.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-1 flex-col items-center justify-between"
                >
                  <span className="text-xs text-muted-foreground">
                    {formatInstantLocal(item.createdAt)}
                  </span>
                  <MovieCard movie={item.movie} showTitle={false} />
                  <span className="text-xs text-muted-foreground">
                    {item.user.name || "Unknown User"}
                  </span>
                </div>
              ))}
              {(!stats?.latestSyllabus ||
                stats.latestSyllabus.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No syllabus items found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Home;
