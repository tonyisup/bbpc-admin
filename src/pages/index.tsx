import { NextPage } from "next";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mic2, Users } from "lucide-react";
import Link from "next/link";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const { data: isAdmin } = trpc.auth.isAdmin.useQuery(undefined, { enabled: !!session });

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
                <div className="text-2xl font-bold">Manage</div>
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
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Manage admin users
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}

export default Home;
