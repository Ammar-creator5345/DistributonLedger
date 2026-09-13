"use client"

import * as React from "react"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import { PanelLeftIcon } from "lucide-react"
import { cn } from "cn"
import { useIsMobile } from "@/hooks/use-mobile"
import { Separator } from "@/components/ui/separator"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3.5rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

/**
 * Rebuilt from scratch on plain React state + MUI Drawer (mobile) instead of shadcn's
 * Radix-based Sidebar/Sheet — only `app-sidebar.tsx` and the dashboard layout consume this, so
 * the export surface is trimmed to what they actually use rather than the full ~700-line
 * shadcn API (SidebarRail, SidebarMenuSub, SidebarMenuBadge, etc. had zero consumers).
 */
type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.")
  return ctx
}

function readInitialOpen(defaultOpen: boolean) {
  if (typeof document === "undefined") return defaultOpen
  const match = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=(true|false)`))
  return match ? match[1] === "true" : defaultOpen
}

function SidebarProvider({
  defaultOpen = true,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [open, _setOpen] = React.useState(() => readInitialOpen(defaultOpen))

  const setOpen = React.useCallback((value: boolean | ((v: boolean) => boolean)) => {
    _setOpen((prev) => {
      const next = typeof value === "function" ? value(prev) : value
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      return next
    })
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v)
    else setOpen((v) => !v)
  }, [isMobile, setOpen])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggleSidebar])

  const state = open ? "expanded" : "collapsed"
  const value = React.useMemo<SidebarContextValue>(
    () => ({ state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        className={cn("flex w-full", className)}
        style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar()

  if (isMobile) {
    return (
      <Drawer
        anchor="top"
        open={openMobile}
        onClose={() => setOpenMobile(false)}
        slotProps={{
          paper: {
            className: "flex max-h-[85vh] flex-col overflow-y-auto bg-sidebar text-sidebar-foreground pt-3.75 px-3.75",
            style: { width: "100%" },
          },
        }}
      >
        {children}
      </Drawer>
    )
  }

  const { toggleSidebar } = useSidebar()

  return (
    <div
      data-state={state}
      data-slot="sidebar"
      className={cn(
        "relative z-10 hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        "pt-14",
        state === "expanded" ? "w-(--sidebar-width) pl-3.75" : "w-(--sidebar-width-icon) pl-0",
        className
      )}
    >
      <div className={cn("absolute z-20 flex top-4 border -right-4 rounded-full w-fit shrink-0 items-center bg-card", state === "expanded" ? "justify-end" : "justify-center")}>
        <IconButton
          data-slot="sidebar-rail-trigger"
          size="small"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {state === "expanded" ? (
            <ChevronLeftRoundedIcon fontSize="small" />
          ) : (
            <ChevronRightRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </div>
      {children}
    </div>
  )
}

function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, isMobile } = useSidebar()
  // Desktop already has its own rail-trigger on the persistent sidebar; this one is only for
  // opening the mobile drawer. Not rendering it here (rather than hiding it with a `md:hidden`
  // class) sidesteps a real bug: MUI's own base `display` style on IconButton wins over a
  // Tailwind `md:hidden` class in this app's cascade, so the CSS-hide approach silently failed
  // and the button stayed visible on desktop — verified against a real rendered page.
  if (!isMobile) return null
  return (
    <IconButton
      data-slot="sidebar-trigger"
      size="small"
      onClick={toggleSidebar}
      className={cn("rounded-md", className)}
      aria-label="Toggle sidebar"
    >
      <PanelLeftIcon className="size-4" />
    </IconButton>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("relative flex w-full min-h-0 flex-1 flex-col overflow-y-auto bg-background", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="sidebar-separator" className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-0 overflow-auto overflow-x-hidden", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("w-full text-sm", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("relative", className)} {...props} />
}

function SidebarMenuButton({
  asChild,
  isActive = false,
  tooltip,
  className,
  children,
  ...props
}: {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
  className?: string
  children: React.ReactElement<{ className?: string }>
} & Omit<React.ComponentPropsWithoutRef<"button">, "children">) {
  const { state, isMobile } = useSidebar()
  void asChild

  const classes = cn(
    "group/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2 text-left text-sm font-medium transition-colors outline-none [&_svg]:size-4 [&_svg]:shrink-0",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    "data-[active=true]:bg-sidebar-active data-[active=true]:font-medium data-[active=true]:text-sidebar-active-foreground data-[active=true]:shadow-sm",
    state === "collapsed" && !isMobile && "justify-center px-0",
    className
  )

  const content = React.cloneElement(children, {
    className: cn(classes, children.props.className),
    "data-active": isActive,
    ...props,
  } as { className: string; "data-active": boolean })

  if (!tooltip || state !== "collapsed" || isMobile) return content

  return (
    <Tooltip title={tooltip} placement="right">
      {content}
    </Tooltip>
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
