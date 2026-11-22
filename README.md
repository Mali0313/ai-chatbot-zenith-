# Nova — Intelligent Minimalist AI Chatbot

A sleek, responsive, ChatGPT-style AI chatbot built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Supabase Auth & Storage**, and the **Google Gen AI SDK (`@google/genai`)**.

Strictly monochrome: high-contrast dark mode (`#0a0a0a`) and light mode (`#ffffff`) with subtle grey structural dividers (`#262626` / `#e5e5e5`).

---

## Features

- **ChatGPT-Inspired UI**: Right-aligned user bubbles (white in dark mode, black in light mode), left-aligned AI markdown responses, and circular avatar indicators.
- **Real-Time Token Streaming**: Streams responses chunk by chunk using standard Web Streams (`ReadableStream`) with an animated typing cursor.
- **Rich Markdown & Code Highlighting**: Rendered with `react-markdown` and `remark-gfm`. Features code blocks with language headers, copy buttons, and strict monochrome syntax highlighting via Prism.
- **Chat Management**:
  - Auto-generated conversation titles from first prompts.
  - Sidebar conversations categorized into **Today**, **Yesterday**, and **Older**.
  - Inline rename and delete actions.
  - Regenerate button on the latest AI response.
  - Persistent browser storage with `localStorage`.
- **Harden & Production Ready**:
  - Server-side rate limiting (20 requests/min per IP).
  - Capped maximum tokens (`maxOutputTokens: 2048`).
  - Strict server boundary: API keys are never exposed in client bundles.
  - Shimmering loading skeletons and smooth transitions.
  - Dynamic high-DPI favicon (`/icon`) and full SEO metadata.
  - Settings modal with theme switcher and conversation data clearing.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Engine**: [Google Gen AI SDK (`@google/genai`)](https://github.com/google-gemini/deprecations)
- **Markdown & Code**: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18.17+ or 20+
- An API key for Google Gemini from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
AI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

### Step 1: Push to GitHub
Commit your project and push to a remote repository:
```bash
git add .
git commit -m "Initial commit for Nova AI chatbot"
git push origin main
```

### Step 2: Import into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository and click **Import**.

### Step 3: Configure Environment Variables
Under the **Environment Variables** section, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `AI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key from Google AI Studio. |

*(Note: `GEMINI_API_KEY` is also supported as a fallback).*

### Step 4: Deploy
Click **Deploy**. Vercel will automatically run `npm run build` and launch your serverless app globally on the Edge Network.

---

## Scripts

- `npm run dev` - Start local development server with Turbopack
- `npm run build` - Create an optimized production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint verification
