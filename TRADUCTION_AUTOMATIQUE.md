# Traduction Automatique du Contenu - Guide d'Implémentation

## 🎯 Objectif

Permettre la traduction automatique des posts créés en français vers l'anglais (et vice versa) pour offrir un contenu multilingue sans saisie manuelle.

---

## 📋 Solutions Recommandées

### Solution 1 : Traduction IA en Temps Réel (Recommandée) ⭐

Cette solution traduit automatiquement le contenu lors de la création/modification d'un post.

#### Architecture

```
┌─────────────────┐
│  Utilisateur    │
│  crée post (FR) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  Validation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service de     │
│  Traduction IA  │
│  (GPT/DeepL)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sauvegarde     │
│  Post + Trans.  │
│  dans MongoDB   │
└─────────────────┘
```

#### Option A : OpenAI GPT-4 (Meilleure qualité)

```bash
cd api-fastify
pnpm add openai
```

```typescript
// api-fastify/src/services/translation.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TranslationOptions {
  text: string;
  fromLang: 'fr' | 'en';
  toLang: 'fr' | 'en';
  context?: 'title' | 'content' | 'summary';
}

export async function translateWithGPT(options: TranslationOptions): Promise<string> {
  const { text, fromLang, toLang, context = 'content' } = options;

  const prompts = {
    title: `Traduis ce titre de blog de ${fromLang} vers ${toLang}. Garde le style et le ton. Réponds uniquement avec la traduction :`,
    content: `Traduis ce contenu de blog de ${fromLang} vers ${toLang}. Préserve le formatage Markdown, les liens et le style. Réponds uniquement avec la traduction :`,
    summary: `Traduis ce résumé de ${fromLang} vers ${toLang}. Garde le style concis. Réponds uniquement avec la traduction :`
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Tu es un traducteur professionnel spécialisé dans le contenu de blogs techniques.'
        },
        {
          role: 'user',
          content: `${prompts[context]}\n\n${text}`
        }
      ],
      temperature: 0.3, // Traduction plus précise
      max_tokens: 4000
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error('Erreur traduction GPT:', error);
    throw new Error('Échec de la traduction');
  }
}

// Traduction complète d'un post
export async function translatePost(post: any, targetLang: 'fr' | 'en') {
  const sourceLang = targetLang === 'en' ? 'fr' : 'en';

  const [translatedTitle, translatedContent, translatedSummary] = await Promise.all([
    translateWithGPT({
      text: post.title,
      fromLang: sourceLang,
      toLang: targetLang,
      context: 'title'
    }),
    translateWithGPT({
      text: post.content,
      fromLang: sourceLang,
      toLang: targetLang,
      context: 'content'
    }),
    post.summary ? translateWithGPT({
      text: post.summary,
      fromLang: sourceLang,
      toLang: targetLang,
      context: 'summary'
    }) : Promise.resolve('')
  ]);

  return {
    title: translatedTitle,
    content: translatedContent,
    summary: translatedSummary
  };
}
```

#### Option B : DeepL (Bon compromis qualité/prix)

```bash
cd api-fastify
pnpm add deepl-node
```

```typescript
// api-fastify/src/services/translation.service.ts
import * as deepl from 'deepl-node';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

export async function translateWithDeepL(
  text: string,
  targetLang: 'fr' | 'en'
): Promise<string> {
  try {
    const result = await translator.translateText(
      text,
      null, // Auto-détection langue source
      targetLang === 'en' ? 'en-US' : 'fr',
      {
        preserveFormatting: true,
        tagHandling: 'xml' // Pour préserver le markdown
      }
    );

    return result.text;
  } catch (error) {
    console.error('Erreur traduction DeepL:', error);
    throw new Error('Échec de la traduction');
  }
}

export async function translatePostWithDeepL(post: any, targetLang: 'fr' | 'en') {
  const [translatedTitle, translatedContent, translatedSummary] = await Promise.all([
    translateWithDeepL(post.title, targetLang),
    translateWithDeepL(post.content, targetLang),
    post.summary ? translateWithDeepL(post.summary, targetLang) : Promise.resolve('')
  ]);

  return {
    title: translatedTitle,
    content: translatedContent,
    summary: translatedSummary
  };
}
```

#### Option C : Google Translate (Budget)

```bash
cd api-fastify
pnpm add @google-cloud/translate
```

```typescript
// api-fastify/src/services/translation.service.ts
import { Translate } from '@google-cloud/translate/build/src/v2';

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

export async function translateWithGoogle(
  text: string,
  targetLang: 'fr' | 'en'
): Promise<string> {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Erreur traduction Google:', error);
    throw new Error('Échec de la traduction');
  }
}
```

#### Option D : LibreTranslate (100% Gratuit) ⭐ MVP

LibreTranslate est une API de traduction open-source, gratuite et auto-hébergeable.

```bash
cd api-fastify
pnpm add node-fetch
```

```typescript
// api-fastify/src/services/translation.service.ts
import fetch from 'node-fetch';

export async function translateWithLibreTranslate(
  text: string,
  targetLang: 'fr' | 'en'
): Promise<string> {
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: targetLang === 'en' ? 'fr' : 'en',
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }

    const result = await response.json();
    return result.translatedText;
  } catch (error) {
    console.error('Erreur traduction LibreTranslate:', error);
    throw new Error('Échec de la traduction');
  }
}

export async function translatePostWithLibreTranslate(post: any, targetLang: 'fr' | 'en') {
  const [translatedTitle, translatedContent, translatedSummary] = await Promise.all([
    translateWithLibreTranslate(post.title, targetLang),
    translateWithLibreTranslate(post.content, targetLang),
    post.summary ? translateWithLibreTranslate(post.summary, targetLang) : Promise.resolve('')
  ]);

  return {
    title: translatedTitle,
    content: translatedContent,
    summary: translatedSummary
  };
}
```

**Avantages** :
- ✅ 100% gratuit
- ✅ Open source
- ✅ Peut être auto-hébergé
- ✅ Pas de limite de quota sur instance publique
- ✅ Support +20 langues (dont FR ↔ EN)

**Inconvénients** :
- ❌ Qualité inférieure à DeepL/GPT-4
- ❌ Instances publiques parfois surchargées
- ❌ Peut nécessiter retry logic

**Auto-hébergement (optionnel)** :
```yaml
# docker-compose.yml - Ajouter
services:
  libretranslate:
    image: libretranslate/libretranslate:latest
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - LT_DISABLE_WEB_UI=false
    volumes:
      - libretranslate_data:/home/libretranslate/.local
```

#### Option E : MyMemory Translation API (Freemium)

API gratuite avec quota quotidien généreux (50,000 caractères/jour).

```bash
# Aucune dépendance supplémentaire nécessaire
```

```typescript
// api-fastify/src/services/translation.service.ts
import fetch from 'node-fetch';

export async function translateWithMyMemory(
  text: string,
  targetLang: 'fr' | 'en'
): Promise<string> {
  try {
    const sourceLang = targetLang === 'en' ? 'fr' : 'en';
    const langPair = `${sourceLang}|${targetLang}`;
    
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
      {
        headers: {
          'User-Agent': 'MERN-Blog/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.responseStatus !== 200) {
      throw new Error(`MyMemory translation failed: ${result.responseDetails}`);
    }

    return result.responseData.translatedText;
  } catch (error) {
    console.error('Erreur traduction MyMemory:', error);
    throw new Error('Échec de la traduction');
  }
}

export async function translatePostWithMyMemory(post: any, targetLang: 'fr' | 'en') {
  // MyMemory recommande des pauses entre requêtes
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const translatedTitle = await translateWithMyMemory(post.title, targetLang);
  await delay(500); // Pause 500ms entre requêtes

  const translatedContent = await translateWithMyMemory(post.content, targetLang);
  await delay(500);

  const translatedSummary = post.summary 
    ? await translateWithMyMemory(post.summary, targetLang)
    : '';

  return {
    title: translatedTitle,
    content: translatedContent,
    summary: translatedSummary
  };
}
```

**Avantages** :
- ✅ Gratuit jusqu'à 50,000 caractères/jour
- ✅ Aucune clé API requise
- ✅ Facile à intégrer
- ✅ Bon pour MVP et prototypes

**Inconvénients** :
- ❌ Quota quotidien limité (~15 posts/jour)
- ❌ Qualité variable selon les langues
- ❌ Nécessite rate limiting
- ❌ Pas adapté pour production à grande échelle

---

### Modèle de Données avec Traductions

```typescript
// api-fastify/src/models/Post.ts
import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  // Langue originale du post
  originalLanguage: {
    type: String,
    enum: ['fr', 'en'],
    required: true,
    default: 'fr'
  },

  // Contenu dans toutes les langues
  translations: {
    fr: {
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      summary: String,
      slug: {
        type: String,
        required: true
      }
    },
    en: {
      title: String,
      content: String,
      summary: String,
      slug: String
    }
  },

  // Métadonnées communes (langue neutre)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [String],
  featuredImage: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // État des traductions
  translationStatus: {
    en: {
      type: String,
      enum: ['none', 'pending', 'completed', 'failed'],
      default: 'none'
    }
  },
  lastTranslatedAt: {
    en: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour recherche multilingue
PostSchema.index({ 'translations.fr.title': 'text', 'translations.fr.content': 'text' });
PostSchema.index({ 'translations.en.title': 'text', 'translations.en.content': 'text' });

export default mongoose.model('Post', PostSchema);
```

---

### Implémentation dans le Contrôleur

```typescript
// api-fastify/src/controllers/post.controller.ts
import { translatePost } from '../services/translation.service';
import Post from '../models/Post';
import slugify from 'slugify';

export async function createPost(request, reply) {
  const { title, content, summary, category, tags, originalLanguage = 'fr' } = request.body;
  const userId = request.user.id;

  try {
    // 1. Créer le post dans la langue originale
    const post = new Post({
      originalLanguage,
      author: userId,
      category,
      tags,
      translations: {
        [originalLanguage]: {
          title,
          content,
          summary,
          slug: slugify(title, { lower: true, strict: true })
        }
      },
      translationStatus: {
        en: originalLanguage === 'fr' ? 'pending' : 'none'
      }
    });

    await post.save();

    // 2. Lancer la traduction asynchrone (si langue originale = FR)
    if (originalLanguage === 'fr') {
      // Option A : Traduction immédiate (bloquante)
      // const translated = await translatePost(post.translations.fr, 'en');
      // post.translations.en = {
      //   ...translated,
      //   slug: slugify(translated.title, { lower: true, strict: true })
      // };
      // post.translationStatus.en = 'completed';
      // await post.save();

      // Option B : Traduction en arrière-plan (recommandé)
      translateInBackground(post._id, 'en').catch(console.error);
    }

    return reply.code(201).send({
      success: true,
      post: formatPostForResponse(post, originalLanguage)
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    return reply.code(500).send({
      success: false,
      message: 'Erreur lors de la création du post'
    });
  }
}

// Traduction en arrière-plan
async function translateInBackground(postId: string, targetLang: 'en' | 'fr') {
  try {
    const post = await Post.findById(postId);
    if (!post) return;

    const sourceLang = targetLang === 'en' ? 'fr' : 'en';
    post.translationStatus[targetLang] = 'pending';
    await post.save();

    // Traduction
    const translated = await translatePost(post.translations[sourceLang], targetLang);

    // Sauvegarde
    post.translations[targetLang] = {
      ...translated,
      slug: slugify(translated.title, { lower: true, strict: true })
    };
    post.translationStatus[targetLang] = 'completed';
    post.lastTranslatedAt = { [targetLang]: new Date() };
    await post.save();

    console.log(`Post ${postId} traduit en ${targetLang}`);
  } catch (error) {
    console.error('Erreur traduction arrière-plan:', error);
    
    // Marquer comme échoué
    const post = await Post.findById(postId);
    if (post) {
      post.translationStatus[targetLang] = 'failed';
      await post.save();
    }
  }
}

// Formater post pour la réponse API
function formatPostForResponse(post: any, lang: string) {
  const translation = post.translations[lang];
  
  return {
    _id: post._id,
    title: translation?.title || post.translations[post.originalLanguage].title,
    content: translation?.content || post.translations[post.originalLanguage].content,
    summary: translation?.summary || post.translations[post.originalLanguage].summary,
    slug: translation?.slug || post.translations[post.originalLanguage].slug,
    originalLanguage: post.originalLanguage,
    availableLanguages: Object.keys(post.translations).filter(
      lang => post.translations[lang].title
    ),
    translationStatus: post.translationStatus,
    author: post.author,
    category: post.category,
    tags: post.tags,
    featuredImage: post.featuredImage,
    status: post.status,
    viewCount: post.viewCount,
    likeCount: post.likedBy?.length || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
}

// Récupération d'un post dans la langue demandée
export async function getPost(request, reply) {
  const { id } = request.params;
  const { lang = 'fr' } = request.query;

  try {
    const post = await Post.findById(id)
      .populate('author', 'username profilePicture')
      .populate('category', 'name slug');

    if (!post) {
      return reply.code(404).send({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Si traduction demandée non disponible, déclencher traduction
    if (!post.translations[lang]?.title && post.translationStatus[lang] === 'none') {
      translateInBackground(post._id, lang as 'en' | 'fr').catch(console.error);
    }

    return reply.send({
      success: true,
      post: formatPostForResponse(post, lang)
    });
  } catch (error) {
    console.error('Erreur récupération post:', error);
    return reply.code(500).send({
      success: false,
      message: 'Erreur lors de la récupération du post'
    });
  }
}
```

---

### Routes API

```typescript
// api-fastify/src/routes/posts.routes.ts
import { FastifyInstance } from 'fastify';
import * as postController from '../controllers/post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export async function postRoutes(fastify: FastifyInstance) {
  // Créer un post (authentifié)
  fastify.post('/posts', {
    preHandler: authMiddleware,
    handler: postController.createPost
  });

  // Récupérer un post (avec langue)
  fastify.get('/posts/:id', postController.getPost);

  // Forcer la retraduction d'un post
  fastify.post('/posts/:id/translate/:lang', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const { id, lang } = request.params;
      
      try {
        const post = await Post.findById(id);
        if (!post) {
          return reply.code(404).send({ message: 'Post non trouvé' });
        }

        // Lancer traduction
        await translateInBackground(id, lang as 'en' | 'fr');

        return reply.send({
          success: true,
          message: 'Traduction en cours'
        });
      } catch (error) {
        return reply.code(500).send({ message: 'Erreur traduction' });
      }
    }
  });
}
```

---

### Configuration Frontend

```typescript
// src/services/api.ts
export async function createPost(postData: {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string[];
  originalLanguage?: 'fr' | 'en';
}) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(postData)
  });

  return response.json();
}

export async function getPost(id: string, lang: 'fr' | 'en' = 'fr') {
  const response = await fetch(`/api/posts/${id}?lang=${lang}`);
  return response.json();
}

export async function forceTranslation(id: string, lang: 'fr' | 'en') {
  const response = await fetch(`/api/posts/${id}/translate/${lang}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });

  return response.json();
}
```

---

### Interface Utilisateur

```tsx
// src/components/PostCreator.tsx
import { useState } from 'react';
import { createPost } from '../services/api';

export function PostCreator() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    originalLanguage: 'fr' as 'fr' | 'en'
  });
  const [autoTranslate, setAutoTranslate] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createPost({
        ...formData,
        originalLanguage: formData.originalLanguage
      });

      if (autoTranslate && result.success) {
        // Afficher notification
        alert('Post créé ! La traduction sera disponible dans quelques instants.');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Langue du contenu</label>
        <select
          value={formData.originalLanguage}
          onChange={(e) => setFormData({
            ...formData,
            originalLanguage: e.target.value as 'fr' | 'en'
          })}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={autoTranslate}
            onChange={(e) => setAutoTranslate(e.target.checked)}
          />
          Traduire automatiquement
        </label>
      </div>

      <input
        type="text"
        placeholder="Titre"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <textarea
        placeholder="Contenu"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      />

      <button type="submit">Publier</button>
    </form>
  );
}
```

```tsx
// src/components/PostViewer.tsx
import { useState, useEffect } from 'react';
import { getPost, forceTranslation } from '../services/api';

export function PostViewer({ postId }: { postId: string }) {
  const [post, setPost] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    loadPost(currentLang);
  }, [postId, currentLang]);

  const loadPost = async (lang: 'fr' | 'en') => {
    const result = await getPost(postId, lang);
    setPost(result.post);
  };

  const handleTranslate = async () => {
    const targetLang = currentLang === 'fr' ? 'en' : 'fr';
    await forceTranslation(postId, targetLang);
    
    // Attendre un peu puis recharger
    setTimeout(() => loadPost(targetLang), 3000);
    setCurrentLang(targetLang);
  };

  if (!post) return <div>Chargement...</div>;

  const translationAvailable = post.availableLanguages.includes(currentLang);

  return (
    <div>
      <div className="language-switcher">
        <button
          onClick={() => setCurrentLang('fr')}
          disabled={currentLang === 'fr'}
        >
          🇫🇷 Français
        </button>
        <button
          onClick={() => setCurrentLang('en')}
          disabled={currentLang === 'en'}
        >
          🇬🇧 English
        </button>
      </div>

      {!translationAvailable && (
        <div className="translation-notice">
          <p>Traduction en {currentLang} : {post.translationStatus[currentLang]}</p>
          {post.translationStatus[currentLang] === 'none' && (
            <button onClick={handleTranslate}>
              Traduire maintenant
            </button>
          )}
        </div>
      )}

      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </div>
  );
}
```

---

## Solution 2 : Traduction à la Demande (Alternative)

Au lieu de traduire automatiquement, traduire uniquement quand un utilisateur demande le contenu dans une autre langue.

### Avantages
- ✅ Économise les coûts API
- ✅ Évite traductions inutiles
- ✅ Traductions plus fraîches

### Inconvénients
- ❌ Latence lors de la première demande
- ❌ UX moins fluide

---

## Solution 3 : Cache de Traductions

Pour optimiser les coûts, mettre en cache les traductions dans Redis.

```typescript
// api-fastify/src/services/translation-cache.service.ts
import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});

export async function getCachedTranslation(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string | null> {
  const cacheKey = `translation:${fromLang}:${toLang}:${hashText(text)}`;
  return await redis.get(cacheKey);
}

export async function setCachedTranslation(
  text: string,
  fromLang: string,
  toLang: string,
  translation: string
): Promise<void> {
  const cacheKey = `translation:${fromLang}:${toLang}:${hashText(text)}`;
  await redis.setex(cacheKey, 86400 * 30, translation); // 30 jours
}

function hashText(text: string): string {
  return require('crypto').createHash('md5').update(text).digest('hex');
}
```

---

## Solution 4 : Fallback Multi-Services (Production)

Pour maximiser la disponibilité et optimiser les coûts, implémenter un système de fallback automatique.

```typescript
// api-fastify/src/services/translation-fallback.service.ts
import { translateWithGPT } from './translation.service';
import { translateWithDeepL } from './translation.service';
import { translateWithLibreTranslate } from './translation.service';

interface TranslationService {
  name: string;
  translate: (text: string, targetLang: 'fr' | 'en') => Promise<string>;
  priority: number; // 1 = highest
  cost: number; // Coût estimé par traduction
}

const services: TranslationService[] = [
  {
    name: 'gpt-4',
    translate: translateWithGPT,
    priority: 1,
    cost: 0.08
  },
  {
    name: 'deepl',
    translate: translateWithDeepL,
    priority: 2,
    cost: 0.03
  },
  {
    name: 'libretranslate',
    translate: translateWithLibreTranslate,
    priority: 3,
    cost: 0
  }
].sort((a, b) => a.priority - b.priority);

export async function translateWithFallback(
  text: string,
  targetLang: 'fr' | 'en',
  maxRetries: number = 3
): Promise<{ translation: string; service: string; cost: number }> {
  let lastError: Error | null = null;

  for (const service of services) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Tentative traduction avec ${service.name} (essai ${attempt + 1}/${maxRetries})`);
        
        const translation = await service.translate(text, targetLang);
        
        console.log(`✓ Traduction réussie avec ${service.name}`);
        return {
          translation,
          service: service.name,
          cost: service.cost
        };
      } catch (error) {
        console.error(`✗ Échec ${service.name} (essai ${attempt + 1}):`, error);
        lastError = error as Error;
        
        // Attendre avant retry (backoff exponentiel)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
  }

  throw new Error(`Tous les services de traduction ont échoué. Dernière erreur: ${lastError?.message}`);
}
```

**Avantages** :
- ✅ Haute disponibilité (99.9%+)
- ✅ Optimisation coûts automatique
- ✅ Dégradation gracieuse
- ✅ Monitoring par service

---

## Variables d'Environnement

```bash
# api-fastify/.env

# Services de traduction (configurations multiples pour fallback)

# Option 1 : OpenAI (meilleure qualité, $$)
OPENAI_API_KEY=sk-...

# Option 2 : DeepL (bon compromis, $)
DEEPL_API_KEY=...

# Option 3 : Google Translate (budget)
GOOGLE_TRANSLATE_API_KEY=...

# Option 4 : LibreTranslate (GRATUIT) ⭐
LIBRETRANSLATE_URL=https://libretranslate.com  # ou auto-hébergé

# Configuration
TRANSLATION_SERVICE=fallback  # ou 'openai', 'deepl', 'google', 'libretranslate'
TRANSLATION_FALLBACK_ORDER=gpt4,deepl,libretranslate  # Ordre de priorité
ENABLE_TRANSLATION_CACHE=true
TRANSLATION_TIMEOUT=30000  # 30 secondes
TRANSLATION_MAX_RETRIES=3
```

---

## Coûts Estimés

### Services Gratuits

#### LibreTranslate ⭐ Recommandé pour MVP
- **Prix** : **GRATUIT** (instance publique ou auto-hébergée)
- **Post moyen** : ~3000 caractères
- **Coût par post** : **$0**
- **1000 posts/mois** : **$0/mois**
- **Limites** : Qualité correcte, instances publiques parfois lentes

#### MyMemory Translation
- **Prix** : **GRATUIT** jusqu'à 50,000 caractères/jour
- **Post moyen** : ~3000 caractères
- **Coût par post** : **$0** (dans le quota)
- **Capacité gratuite** : ~15-16 posts/jour
- **Pour 1000 posts/mois** : Au-delà du quota gratuit
- **Limites** : Quota quotidien limité

### Services Payants

#### OpenAI GPT-4 Turbo (Meilleure qualité)
- **Prix** : ~$0.01 / 1K tokens entrée, ~$0.03 / 1K tokens sortie
- **Post moyen** : ~2000 tokens
- **Coût par post** : ~$0.08-0.10
- **1000 posts/mois** : ~$100/mois
- **Qualité** : ⭐⭐⭐⭐⭐ Excellente

#### DeepL API Pro (Meilleur rapport qualité/prix)
- **Prix** : $5.49 / 500K caractères (ou $24.99 pour 2M)
- **Post moyen** : ~3000 caractères
- **Coût par post** : ~$0.03
- **1000 posts/mois** : ~$30/mois
- **Qualité** : ⭐⭐⭐⭐ Très bonne

#### Google Translate
- **Prix** : $20 / 1M caractères
- **Post moyen** : ~3000 caractères
- **Coût par post** : ~$0.06
- **1000 posts/mois** : ~$60/mois
- **Qualité** : ⭐⭐⭐ Bonne

---

## Tableau Comparatif des Services

| Service | Coût (1000 posts/mois) | Qualité | Vitesse | Setup | Recommandation |
|---------|------------------------|---------|---------|-------|----------------|
| **LibreTranslate** | **$0** (gratuit) | ⭐⭐⭐ | Moyenne | Facile | ✅ MVP/Démarrage |
| **MyMemory** | **$0** (quota limité) | ⭐⭐ | Rapide | Très facile | ✅ Prototypes |
| **DeepL** | ~$30 | ⭐⭐⭐⭐ | Rapide | Facile | ✅ Production (PME) |
| **GPT-4** | ~$100 | ⭐⭐⭐⭐⭐ | Moyenne | Facile | ✅ Production (qualité max) |
| **Google** | ~$60 | ⭐⭐⭐ | Rapide | Moyen | Alternative |

---

## Migration des Posts Existants

```typescript
// api-fastify/src/scripts/translate-existing-posts.ts
import Post from '../models/Post';
import { translatePost } from '../services/translation.service';

async function translateExistingPosts() {
  const posts = await Post.find({
    'translations.en.title': { $exists: false }
  }).limit(10); // Par batch de 10

  console.log(`Traduction de ${posts.length} posts...`);

  for (const post of posts) {
    try {
      console.log(`Traduction post: ${post._id}`);
      
      const translated = await translatePost(post.translations.fr, 'en');
      
      post.translations.en = {
        ...translated,
        slug: slugify(translated.title, { lower: true, strict: true })
      };
      post.translationStatus.en = 'completed';
      post.lastTranslatedAt = { en: new Date() };
      
      await post.save();
      console.log(`✓ Post ${post._id} traduit`);
      
      // Pause pour respecter rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Erreur post ${post._id}:`, error);
    }
  }

  console.log('Migration terminée');
}

// Exécution
translateExistingPosts().then(() => process.exit(0));
```

```bash
# Lancer la migration
cd api-fastify
tsx src/scripts/translate-existing-posts.ts
```

---

## Queue System pour Traductions (Production)

Pour gérer un grand volume, utiliser BullMQ.

```bash
cd api-fastify
pnpm add bullmq
```

```typescript
// api-fastify/src/queues/translation.queue.ts
import { Queue, Worker } from 'bullmq';
import { translatePost } from '../services/translation.service';
import Post from '../models/Post';

const translationQueue = new Queue('translation', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379
  }
});

// Worker pour traiter les traductions
const worker = new Worker('translation', async (job) => {
  const { postId, targetLang } = job.data;
  
  const post = await Post.findById(postId);
  if (!post) throw new Error('Post non trouvé');

  const sourceLang = targetLang === 'en' ? 'fr' : 'en';
  const translated = await translatePost(post.translations[sourceLang], targetLang);

  post.translations[targetLang] = {
    ...translated,
    slug: slugify(translated.title, { lower: true, strict: true })
  };
  post.translationStatus[targetLang] = 'completed';
  await post.save();

  return { postId, targetLang, success: true };
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379
  },
  concurrency: 3 // 3 traductions en parallèle
});

export async function queueTranslation(postId: string, targetLang: 'en' | 'fr') {
  await translationQueue.add('translate', {
    postId,
    targetLang
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}
```

---

## Recommandations Finales

### Pour Débuter / Budget Zéro (MVP) ⭐
1. ✅ Utiliser **LibreTranslate** (100% gratuit)
2. ✅ Traduction **en arrière-plan** (non bloquante)
3. ✅ Retry logic pour gérer les instances surchargées
4. ✅ Interface simple (bouton "traduire")
5. ✅ Considérer auto-hébergement si volume important

**Alternative** : **MyMemory** si moins de 15 posts/jour

### Pour Production Petit Budget
1. ✅ Utiliser **DeepL** (meilleur rapport qualité/prix ~$30/mois)
2. ✅ Cache Redis pour optimiser
3. ✅ Traduction en arrière-plan
4. ✅ Monitoring basique

### Pour Production Qualité Premium
1. ✅ Utiliser **OpenAI GPT-4** (meilleure qualité ~$100/mois)
2. ✅ **BullMQ** pour gérer la queue
3. ✅ Monitoring traductions (taux succès, temps, coûts)
4. ✅ Fallback multi-services (GPT-4 → DeepL → LibreTranslate)
5. ✅ Interface riche (sélecteur langue, badge disponibilité)

### Stratégie Hybride (Recommandée)
1. ✅ Démarrer avec **LibreTranslate** (gratuit)
2. ✅ Migrer vers **DeepL** quand budget disponible
3. ✅ Utiliser **GPT-4** pour posts importants/marketing
4. ✅ Fallback automatique : GPT-4 → DeepL → LibreTranslate

### Checklist Implémentation
- [ ] Choisir service traduction
- [ ] Modifier modèle Post (traductions multilingues)
- [ ] Implémenter service traduction
- [ ] Modifier contrôleurs (création/lecture)
- [ ] Mettre à jour frontend (sélecteur langue)
- [ ] Configurer variables d'environnement
- [ ] Migrer posts existants
- [ ] Tester avec vrais posts
- [ ] Monitorer coûts et performances

---

## Exemple Complet de Flux

```
1. Utilisateur crée post en français
   → Titre: "Introduction à React"
   → Contenu: "React est une bibliothèque..."

2. Backend sauvegarde
   → originalLanguage: 'fr'
   → translations.fr: { title, content, slug }
   → translationStatus.en: 'pending'

3. Traduction arrière-plan
   → Service appelle GPT-4
   → GPT-4 retourne traduction anglaise
   → "Introduction to React"
   → "React is a library..."

4. Backend met à jour
   → translations.en: { title, content, slug }
   → translationStatus.en: 'completed'
   → lastTranslatedAt.en: Date

5. Utilisateur visite post
   → Peut choisir FR ou EN
   → Contenu affiché dans langue choisie
   → Badge indique langues disponibles
```

---

**Temps d'implémentation estimé** : 20-30 heures

**Coûts mensuels** (1000 posts/mois) :
- **LibreTranslate** : **$0** (gratuit) ⭐ Recommandé pour démarrer
- **MyMemory** : **$0** (si < 15 posts/jour)
- **DeepL** : ~$30 (meilleur rapport qualité/prix)
- **OpenAI GPT-4** : ~$100 (meilleure qualité)
- **Google** : ~$60 (alternative)

**Recommandation par étape** :
1. **Phase 1 (MVP)** : Commencer avec **LibreTranslate** (gratuit)
2. **Phase 2 (Croissance)** : Passer à **DeepL** quand budget disponible
3. **Phase 3 (Maturité)** : **GPT-4** pour qualité premium ou hybride GPT-4+DeepL
