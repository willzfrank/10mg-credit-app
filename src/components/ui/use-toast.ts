import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

export type ToastVariant = "default" | "primary" | "secondary" | "accent" | "success" | "destructive"

export interface ToastItem {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  action?: React.ReactNode
  duration?: number
}

type Action =
  | { type: "ADD_TOAST"; toast: ToastItem }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastItem> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

interface State {
  toasts: ToastItem[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return `toast-${count}`
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        }
      }
      return {
        ...state,
        toasts: [],
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export function toast(props: Omit<ToastItem, "id">) {
  const id = genId()

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
    },
  })

  const duration = props.duration ?? TOAST_REMOVE_DELAY
  if (duration > 0) {
    if (toastTimeouts.has(id)) {
      clearTimeout(toastTimeouts.get(id))
    }
    const timeout = setTimeout(() => {
      dismiss()
      toastTimeouts.delete(id)
    }, duration)
    toastTimeouts.set(id, timeout)
  }

  return {
    id,
    dismiss,
    update: (updates: Partial<ToastItem>) =>
      dispatch({ type: "UPDATE_TOAST", toast: { ...updates, id } }),
  }
}

toast.success = (title: React.ReactNode, description?: React.ReactNode) =>
  toast({ title, description, variant: "accent" })

toast.error = (title: React.ReactNode, description?: React.ReactNode) =>
  toast({ title, description, variant: "destructive" })

toast.info = (title: React.ReactNode, description?: React.ReactNode) =>
  toast({ title, description, variant: "secondary" })

toast.primary = (title: React.ReactNode, description?: React.ReactNode) =>
  toast({ title, description, variant: "primary" })

toast.dismiss = (toastId?: string) =>
  dispatch({ type: "DISMISS_TOAST", toastId })
