import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { LayoutDashboard, Mic2, Users, FileText, Beaker, LogOut, Mic, Sun } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const pathname = router.pathname

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Episodes",
      icon: Mic,
      href: "/episode",
      active: pathname.startsWith("/episode"),
    },
    {
      label: "Users",
      icon: Users,
      href: "/user",
      active: pathname.startsWith("/user"),
    },
    {
      label: "Seasons",
      icon: Mic,
      href: "/season",
      active: pathname.startsWith("/season"),
    },
    {
      label: "About",
      icon: FileText,
      href: "/about",
      active: pathname === "/about",
    },
    {
      label: "Test",
      icon: Beaker,
      href: "/test",
      active: pathname === "/test",
    },
  ]

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)

    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  function toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  return (
    <div className={cn("pb-12 h-screen border-r bg-card", className)}>
      <div className="space-y-4 py-4 h-full flex flex-col">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            BBPC Admin
          </h2>
          <p className="px-2 text-xs text-muted-foreground">
            Manage your podcast
          </p>
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-1 p-2 flex flex-col gap-1">
            {routes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-auto p-4">
          <div className="mb-4">
            <Link href="/record">
              <Button variant="ghost" className="w-full justify-start">
                <Mic2 className="mr-2 h-4 w-4" />
                Record
              </Button>
            </Link>
          </div>
          <Separator className="mb-4" />
          {session?.user && (
            <div className="flex items-center gap-4 mb-4 px-2">
              <Avatar>
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{session.user.name}</span>
                <span className="text-xs text-muted-foreground truncate w-32">{session.user.email}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleTheme()}
            >
              <Sun className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
