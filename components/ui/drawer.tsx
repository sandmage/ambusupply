"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DrawerContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextType | null>(null)

function useDrawer() {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error("Drawer components must be used within a Drawer")
  }
  return context
}

function Drawer({
  open,
  onOpenChange,
  children,
  ...props
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    },
    [isControlled, onOpenChange],
  )

  return (
    <DrawerContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div data-slot="drawer" {...props}>
        {children}
      </div>
    </DrawerContext.Provider>
  )
}

function DrawerTrigger({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDrawer()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenChange(true)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    })
  }

  return (
    <button data-slot="drawer-trigger" {...props} onClick={handleClick}>
      {children}
    </button>
  )
}

function DrawerPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(<div data-slot="drawer-portal">{children}</div>, document.body)
}

function DrawerClose({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDrawer()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenChange(false)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    })
  }

  return (
    <button data-slot="drawer-close" {...props} onClick={handleClick}>
      {children}
    </button>
  )
}

function DrawerOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useDrawer()

  if (!open) return null

  return (
    <div
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50 animate-in fade-in-0", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  direction = "bottom",
  ...props
}: {
  direction?: "top" | "bottom" | "left" | "right"
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useDrawer()

  if (!open) return null

  const directionClasses = {
    top: "inset-x-0 top-0 mb-24 max-h-[80vh] rounded-b-lg border-b animate-in slide-in-from-top",
    bottom: "inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg border-t animate-in slide-in-from-bottom",
    right: "inset-y-0 right-0 w-3/4 border-l sm:max-w-sm animate-in slide-in-from-right",
    left: "inset-y-0 left-0 w-3/4 border-r sm:max-w-sm animate-in slide-in-from-left",
  }

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div
        data-slot="drawer-content"
        data-direction={direction}
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          directionClasses[direction],
          className,
        )}
        {...props}
      >
        {direction === "bottom" && <div className="bg-muted mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full" />}
        {children}
      </div>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-0.5 p-4 text-center md:gap-1.5 md:text-left", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}

function DrawerTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 data-slot="drawer-title" className={cn("text-foreground font-semibold", className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="drawer-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
