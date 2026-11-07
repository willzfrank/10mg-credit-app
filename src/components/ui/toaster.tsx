import { CheckCircle2Icon, AlertCircleIcon, InfoIcon } from "lucide-react"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(function ({ id, title, description, variant, action, ...props }) {
          const isSuccessOrAccent = variant === "accent" || variant === "success"
          const isDestructive = variant === "destructive"
          const isSecondary = variant === "secondary"

          return (
            <Toast key={id} variant={variant} onDismiss={() => dismiss(id)} {...props}>
              <div className="flex items-start gap-2.5">
                {isSuccessOrAccent && (
                  <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 opacity-90" />
                )}
                {isDestructive && (
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5 opacity-90" />
                )}
                {isSecondary && (
                  <InfoIcon className="size-4 shrink-0 mt-0.5 opacity-90" />
                )}
                <div className="grid gap-0.5 flex-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
              </div>
              {action}
            </Toast>
          )
        })}
      </ToastViewport>
    </ToastProvider>
  )
}
