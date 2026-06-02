# Rapport d'Audit Accessibilité — MERN Chat AI Blog

**Date :** 2 juin 2026  
**Périmètre :** `src/` — tous les fichiers `.tsx`, `.ts` et CSS  
**Standard :** WCAG 2.1 (niveaux A et AA)

---

## Résumé exécutif

Le projet frontend implémente déjà plusieurs bonnes pratiques (skip link, focus visible, aria-label sur les boutons de pagination, composants Radix UI accessibles, attribut `lang="en"` sur `<html>`). Cependant, des lacunes importantes persistent dans la gestion des erreurs de formulaire, les boutons icône, la hiérarchie des titres et la gestion du focus dans les modals.

| Sévérité | Problèmes | Critères WCAG principaux |
|----------|-----------|--------------------------|
| Critique | 3 | 1.1.1, 1.3.1, 1.4.3, 3.3.1, 4.1.2 |
| Majeur   | 6 | 1.3.1, 2.4.3, 3.3.2, 4.1.2 |
| Mineur   | 4 | 1.1.1, 1.4.3, 2.4.1, 2.4.6 |

---

## Problèmes CRITIQUES

### C1 — Erreurs de formulaire non associées aux champs
**Fichiers :**
- `src/pages/Register.tsx`
- `src/pages/Login.tsx`
- `src/pages/ChangeUsername.tsx`

**Critère :** 1.3.1 Info et relations (A) · 3.3.1 Identification des erreurs (A)

Les messages d'erreur sont affichés sous les champs mais ne sont pas reliés programmatiquement aux inputs. Un lecteur d'écran ne lira pas l'erreur à la saisie.

**Correction :**
```tsx
// Avant
<input id="email" type="email" />
{errors.email && <p className="text-red-600">{errors.email}</p>}

// Après
<input
  id="email"
  type="email"
  aria-describedby={errors.email ? "email-error" : undefined}
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-red-600">{errors.email}</p>
)}
```

---

### C2 — Boutons icône sans nom accessible
**Fichiers :**
- `src/components/Chatbot.tsx` — boutons Send, Close, Clear (lignes ~231, 262, 357)
- `src/components/Post.tsx` — boutons Like, Bookmark, Share (lignes ~420–461)

**Critère :** 1.1.1 Contenu non textuel (A) · 4.1.2 Nom, rôle, valeur (A)

Les boutons ne contenant qu'une icône (SVG/Lucide) n'ont pas de `aria-label`. Un lecteur d'écran annoncera "bouton" sans contexte.

**Correction :**
```tsx
// Avant
<Button size="icon" onClick={handleSendMessage}>
  <Send className="h-5 w-5" />
</Button>

// Après
<Button size="icon" aria-label="Envoyer le message" onClick={handleSendMessage}>
  <Send className="h-5 w-5" aria-hidden="true" />
</Button>
```

Liste des `aria-label` manquants à ajouter :
| Composant | Bouton | aria-label suggéré |
|-----------|--------|--------------------|
| Chatbot | Envoyer | `"Envoyer le message"` |
| Chatbot | Fermer | `"Fermer le chatbot"` |
| Chatbot | Effacer | `"Effacer la conversation"` |
| Post | Like | `"J'aime cet article"` |
| Post | Bookmark | `"Sauvegarder l'article"` |
| Post | Share | `"Partager l'article"` |

---

### C3 — Contraste insuffisant : couleurs muted avec opacité
**Fichiers :**
- `src/pages/Category.tsx` — `text-muted-foreground/50` (lignes ~268, 272)
- `src/components/Post.tsx` — `text-muted-foreground/80` (ligne ~325)
- `src/components/LatestArticle.tsx` — `text-muted-foreground/80` (ligne ~27)
- `src/components/UsersTable.tsx` — `text-muted-foreground/80` (ligne ~377)

**Critère :** 1.4.3 Contraste (minimum) (AA) — ratio minimum 4.5:1 pour le texte normal

La variable `--muted-foreground` est déjà proche du seuil minimum. Combinée avec `/50` (50% d'opacité), le ratio tombe à ~2:1 en mode clair — **ÉCHEC WCAG AA**.

**Correction :**
```tsx
// Avant
<p className="text-muted-foreground/50">Texte secondaire</p>

// Après — supprimer le modificateur d'opacité
<p className="text-muted-foreground">Texte secondaire</p>
// OU utiliser une couleur avec contraste garanti
<p className="text-foreground/60">Texte secondaire</p>
```

---

## Problèmes MAJEURS

### M1 — Inputs requis sans `aria-required`
**Fichiers :** `src/pages/Register.tsx`, `src/pages/Login.tsx`

**Critère :** 1.3.1 Info et relations (A)

L'attribut HTML `required` est présent mais `aria-required="true"` est absent. Certains lecteurs d'écran anciens ne transmettent pas `required` correctement.

**Correction :** Ajouter `aria-required="true"` sur tous les inputs obligatoires.

---

### M2 — Modal sans gestion du focus ni attributs ARIA
**Fichier :** `src/components/ConfirmationModal.tsx`

**Critère :** 2.4.3 Ordre de focus (A) · 4.1.2 Nom, rôle, valeur (A)

Le modal de confirmation ne déplace pas le focus à l'ouverture, ne le piège pas pendant l'ouverture, et ne relie pas son titre via `aria-labelledby`.

**Correction :**
```tsx
// Ajouter un id sur le titre
<h2 id="modal-title">Supprimer le post</h2>

// Sur le Modal react-modal
<Modal
  isOpen={isOpen}
  onRequestClose={onRequestClose}
  contentLabel="Confirmation de suppression"
  aria={{ labelledby: 'modal-title' }}
  // react-modal gère le focus trap si appElement est configuré
>
```

Aussi : vérifier que `Modal.setAppElement('#root')` est appelé une fois au démarrage pour éviter que le contenu derrière le modal reste annoncé.

---

### M3 — Hiérarchie des titres incorrecte
**Fichier :** `src/pages/Post.tsx` (lignes ~341, 417)

**Critère :** 1.3.1 Info et relations (A)

Des `<h3>` apparaissent sans `<h2>` parent sur la page, cassant la hiérarchie `h1 → h2 → h3`.

**Correction :**
```tsx
// Avant
<h1>Titre du post</h1>
...
<h3>Commentaires</h3>   // saut de niveau
<h3>À propos de l'auteur</h3>

// Après
<h1>Titre du post</h1>
...
<h2>Commentaires</h2>
<h2>À propos de l'auteur</h2>
```

---

### M4 — `<div>` utilisé comme bouton sans support clavier complet
**Fichier :** `src/components/admin/NotificationPanel.tsx` (lignes ~374–375)

**Critère :** 2.1.1 Clavier (A) · 4.1.2 Nom, rôle, valeur (A)

Un `<div>` avec `role="button"` et `tabIndex={0}` est utilisé mais ne gère pas les événements clavier `Enter`/`Space`.

**Correction :**
```tsx
// Remplacer le <div> par un vrai <button>
<button
  type="button"
  onClick={handleClick}
  className="..."
>
  ...
</button>
```

---

### M5 — Images de prévisualisation sans attribut alt
**Fichiers :**
- `src/features/posts/components/PostForm/ExternalImageInput.tsx` (lignes ~101, 178)
- `src/features/posts/components/PostForm/MediaUpload.tsx`

**Critère :** 1.1.1 Contenu non textuel (A)

Les previews d'images uploadées/collées n'ont pas d'attribut `alt`.

**Correction :**
```tsx
// Avant
<img src={previewUrl} />

// Après
<img src={previewUrl} alt="Prévisualisation de l'image de couverture" />
```

---

### M6 — Champ de recherche sans label visible ni aria-label
**Fichier :** `src/components/header.tsx` (lignes ~275–282)

**Critère :** 1.3.1 Info et relations (A) · 3.3.2 Étiquettes ou instructions (A)

L'input de recherche dans le header utilise uniquement un placeholder. Quand l'utilisateur commence à taper, l'instruction disparaît.

**Correction :**
```tsx
<input
  type="search"
  aria-label="Rechercher des articles"
  placeholder="Rechercher..."
/>
```

---

## Problèmes MINEURS

### m1 — Cible du skip link absente du DOM
**Fichier :** `src/components/ui/skip-link.tsx` · layout principal

**Critère :** 2.4.1 Contournement de blocs (A)

Le composant skip link existe et pointe vers `#main-content`, mais aucun élément `id="main-content"` n'est présent dans le layout. Le lien ne fonctionne pas.

**Correction :** Ajouter `id="main-content"` sur le wrapper de contenu principal dans le layout.

```tsx
// Dans le layout/App.tsx
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

---

### m2 — Texte muted avec opacité modérée
**Fichiers :** `src/components/Post.tsx`, `src/components/LatestArticle.tsx`

**Critère :** 1.4.3 Contraste (minimum) (AA)

`text-muted-foreground/80` (80% d'opacité) peut tomber sous 4.5:1 selon la couleur de fond. À vérifier avec un outil de mesure de contraste sur les deux thèmes.

---

### m3 — Placeholder comme seule instruction visible
**Fichiers :** `src/features/posts/components/PostForm/ExternalImageInput.tsx` (ligne ~162)

**Critère :** 2.4.6 En-têtes et étiquettes (AA)

Un input avec `placeholder="Coller l'URL de votre image..."` n'a pas de label visible. Quand l'input est rempli, l'utilisateur perd le contexte de ce qu'il a saisi.

**Correction :** Ajouter un `<label>` ou déplacer l'instruction au-dessus du champ.

---

### m4 — Icônes SVG décoratives non masquées aux lecteurs d'écran
**Divers composants** utilisant des icônes Lucide à côté de texte visible.

**Critère :** 1.1.1 Contenu non textuel (A)

Quand une icône est purement décorative (accompagnée d'un texte visible), elle devrait avoir `aria-hidden="true"` pour éviter une double annonce.

**Correction :**
```tsx
<CalendarIcon aria-hidden="true" className="h-4 w-4" />
<span>12 mai 2025</span>
```

---

## Ce qui fonctionne bien

| Fonctionnalité | Implémentation |
|----------------|----------------|
| Attribut `lang` sur `<html>` | ✅ `lang="en"` dans `index.html` |
| Skip link | ✅ Composant présent (`src/components/ui/skip-link.tsx`) |
| Focus visible | ✅ Règles `focus-visible:` dans `global.css` |
| Composants Radix UI | ✅ Dialog, DropdownMenu, Select — accessibles nativement |
| aria-label pagination | ✅ Boutons "Page suivante", "Page précédente" bien labellisés |
| Sr-only | ✅ Utilisé sur le bouton menu mobile |
| Dark mode | ✅ Variables CSS pour les deux thèmes |
| Sémantique HTML | ✅ `<nav>`, `<main>`, `<article>`, `<header>`, `<footer>` utilisés |

---

## Feuille de route corrective

### Phase 1 — Critique (priorité immédiate)
- [ ] `aria-describedby` + `aria-invalid` sur tous les champs avec erreurs (Register, Login, ChangeUsername)
- [ ] `aria-label` sur tous les boutons icône (Chatbot, Post actions)
- [ ] Supprimer les modificateurs d'opacité `/50` sur `text-muted-foreground`

### Phase 2 — Majeur (sprint suivant)
- [ ] `aria-required="true"` sur les champs obligatoires
- [ ] Modal : `aria-labelledby`, `Modal.setAppElement`, gestion retour focus
- [ ] Corriger la hiérarchie h1→h2→h3 dans Post.tsx
- [ ] Remplacer `<div role="button">` par `<button>` dans NotificationPanel
- [ ] Ajouter `alt` aux images de prévisualisation
- [ ] `aria-label="Rechercher des articles"` sur l'input de recherche

### Phase 3 — Mineur (prochains sprints)
- [ ] Ajouter `id="main-content"` sur le wrapper principal pour que le skip link fonctionne
- [ ] Vérifier contraste `text-muted-foreground/80` avec outil (Target : ≥ 4.5:1)
- [ ] Ajouter `aria-hidden="true"` aux icônes décoratives
- [ ] Remplacer les placeholders-seuls par des labels visibles

### Phase 4 — Tests
- [ ] Audit automatisé : `axe-core` (Storybook ou extension navigateur)
- [ ] Test Lighthouse Accessibility sur les pages principales
- [ ] Test manuel au clavier (Tab order, Enter/Space sur boutons, Escape sur modals)
- [ ] Test VoiceOver (macOS) sur les formulaires et modals

---

## Outils recommandés

```bash
# axe-core CLI
npx axe http://localhost:5173 --exit

# Pa11y
npx pa11y http://localhost:5173

# Lighthouse (dans les DevTools Chrome ou via CI)
npx lighthouse http://localhost:5173 --only-categories=accessibility
```
