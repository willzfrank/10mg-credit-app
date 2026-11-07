import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-50 flex max-h-screen w-full max-w-[380px] flex-col-reverse gap-2 pointer-events-none sm:top-auto sm:bottom-4",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-lg border p-3.5 shadow-md transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        primary: "border-primary/30 bg-primary text-primary-foreground",
        secondary: "border-secondary/40 bg-secondary text-secondary-foreground",
        accent: "border-accent/40 bg-accent text-accent-foreground",
        success:
          "border-border bg-card text-foreground shadow-sm [&_.toast-accent-indicator]:bg-accent",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof toastVariants> & {
      onDismiss?: () => void
    }
>(({ className, variant, onDismiss, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1 space-y-0.5 text-xs">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground/70 hover:text-foreground shrink-0 rounded p-0.5 transition-colors cursor-pointer"
          aria-label="Close toast"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
})
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("text-xs font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[11px] opacity-90 leading-normal", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  toastVariants,
}
