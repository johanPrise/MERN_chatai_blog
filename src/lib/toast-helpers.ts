import { toast } from "../hooks/use-toast"

export const showError = (message: string, title = "Erreur") => {
  toast({
    variant: "destructive",
    title,
    description: message,
  })
}

export const showSuccess = (message: string, title = "Succès") => {
  toast({
    title,
    description: message,
  })
}

export const showInfo = (message: string, title = "Information") => {
  toast({
    title,
    description: message,
  })
}