import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Container } from "../components/ui/container"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { H1 } from "../components/ui/typography"
import AnimateOnView from "../components/AnimateOnView"
import { ArrowLeft, Users, Clock, Bell, Loader2 } from "lucide-react"
import { API_ENDPOINTS } from "../config/api.config"
import { toast } from "../hooks/use-toast"

const EMAIL_REGEX = /^\S+@\S+\.\S+$/

export default function ComingSoon() {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(API_ENDPOINTS.waitlist.join, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "community" }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.message || "Échec de l'inscription")
      }

      toast({
        title: "C'est noté !",
        description: data?.message || "Nous vous préviendrons dès que ce sera disponible.",
      })
      setEmail("")
      setShowForm(false)
    } catch (err) {
      toast({
        title: "Oups",
        description: err instanceof Error ? err.message : "Une erreur est survenue. Réessayez plus tard.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center">
      <Container className="text-center">
        <AnimateOnView animation="fade" delay={100}>
          <div className="max-w-2xl mx-auto">
            {/* Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>

            {/* Title */}
            <H1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-text">
              Communauté
              <br />
              <span className="text-primary">Bientôt Disponible</span>
            </H1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Nous travaillons sur une fonctionnalité communauté incroyable qui vous permettra de vous connecter avec d'autres passionnés d'écriture et de partager vos expériences.
            </p>

            {/* Features preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-background/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Groupes de Discussion</h3>
                <p className="text-sm text-muted-foreground">Rejoignez des groupes thématiques et échangez avec la communauté</p>
              </div>

              <div className="p-6 bg-background/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                <Bell className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Événements</h3>
                <p className="text-sm text-muted-foreground">Participez à des événements d'écriture et des ateliers</p>
              </div>

              <div className="p-6 bg-background/30 backdrop-blur-sm border border-border/30 rounded-2xl">
                <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Défis d'Écriture</h3>
                <p className="text-sm text-muted-foreground">Relevez des défis créatifs et améliorez vos compétences</p>
              </div>
            </div>

            {/* CTA */}
            {showForm ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
              >
                <Input
                  type="email"
                  inputMode="email"
                  autoFocus
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11"
                  aria-label="Adresse email"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inscription…
                    </>
                  ) : (
                    "M'inscrire"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Me notifier
                </Button>
              </div>
            )}
          </div>
        </AnimateOnView>
      </Container>
    </main>
  )
}
