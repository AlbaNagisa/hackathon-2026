@AGENTS.md

# TechCorp AI Chat — Frontend (hackathon-2026)

Interface web de chat pour le **Challenge IA 7h** de TechCorp. Objectif **non négociable** :
rendre le modèle **Phi-3.5-Financial** utilisable en temps réel via une interface chat professionnelle.
Cette app est le livrable de la filière **DEV WEB**.

## Stack

- **Next.js 16.2.9** — App Router, code dans `src/app/`
- **React 19.2.4** + **TypeScript 5**
- **Tailwind CSS v4** (`@tailwindcss/postcss`, styles globaux dans `src/app/globals.css`)
- **ESLint 9** flat config (`eslint.config.mjs`)
- Polices **Geist** via `next/font/google`

> Next.js 16 embarque des **breaking changes** vs les versions plus anciennes (cf. `AGENTS.md`).
> Lire `node_modules/next/dist/docs/` avant d'écrire du code Next — ne pas se fier de mémoire à l'API.

## Commandes

```bash
npm install      # installer les dépendances (node_modules non versionné)
npm run dev      # dev server → http://localhost:3000
npm run build    # build de production
npm run start    # servir le build de prod
npm run lint     # ESLint
```

## Structure

```
src/app/
├── layout.tsx     # layout racine (html/body, polices Geist)
├── page.tsx       # page d'accueil — À REMPLACER par l'interface de chat
└── globals.css    # styles globaux + Tailwind
public/            # assets statiques (svg)
```

> État actuel : template `create-next-app` par défaut. L'interface de chat reste à construire.

## Intégration avec le serveur d'inférence (équipe INFRA)

Le front consomme l'API d'inférence exposée par INFRA. Endpoints selon la solution retenue :

| Solution | URL |
|---|---|
| Ollama | `http://localhost:11434` (API `/api/chat` ou `/api/generate`) |
| Triton | `http://localhost:8000` |
| Serveur maison | URL/port communiqués par INFRA |

**Pattern recommandé : route API Next.js en proxy.** Créer `src/app/api/chat/route.ts` qui relaie les
requêtes vers le serveur d'inférence (gère le streaming, masque l'URL au client, évite les soucis CORS).
Mettre l'URL du serveur dans une variable d'environnement (`.env.local`, ex. `INFERENCE_URL`), jamais en dur.

## Conventions

- Réponses et commentaires en **français** (équipe francophone).
- Composants en TypeScript, App Router (Server Components par défaut ; `"use client"` seulement si nécessaire — état du chat, événements).
- Styliser avec Tailwind v4, pas de CSS inline ad hoc.
- Lancer `npm run lint` avant de commit.
- Ne pas committer de secrets ni l'URL d'inférence en dur (utiliser `.env.local`, déjà ignoré par git).
