import React, { useState } from "react"
import { Sidebar } from "./Sidebar"
import { useSession } from "next-auth/react"
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { Button } from "../ui/button"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // We don't strictly enforce auth here because the pages do it via getServerSideProps
  // But visually we can control the layout.

  // If loading, we might want a spinner or skeleton, but for now just render
  if (status === "loading") return null

  // If not authenticated, we typically don't show the sidebar,
  // BUT the current app structure has a "Home" page that shows a "Sign in" button if not logged in.
  // So we need to decide:
  // 1. If not logged in -> Show simplified layout (centered content)
  // 2. If logged in -> Show Dashboard Layout (Sidebar + Content)

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <div className="hidden w-64 flex-col md:flex fixed inset-y-0 z-50">
          <Sidebar />
        </div>
      )}

      {/* Desktop Toggle Button */}
      <div className="hidden md:block fixed top-4 z-[60]" style={{ left: sidebarOpen ? '272px' : '16px' }}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card border-2 border-border shadow-md hover:bg-accent"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center p-4 bg-background border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar className="border-none" />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold">BBPC Admin</span>
      </div>

      <main
        className="flex-1 pt-16 md:pt-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? '256px' : '0px' }}
      >
        <div className="h-full p-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
