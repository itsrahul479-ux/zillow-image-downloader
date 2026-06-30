# ListingGrabber AI 🏢

An ultra-polished, production-grade media extraction web application that helps users download high-resolution photos from Zillow listings. Built with a responsive, modern interface inspired by ChatGPT, Vercel, and Linear, utilizing React 19, Vite, Express, and Framer Motion.

## ✨ Features

- ⚡️ **One-Click Media Extraction**: Instantly scans Zillow pages to locate, isolate, and list every high-resolution photo.
- 📦 **On-the-Fly ZIP Bundling**: Downloads, packages, and compresses multiple or all selected photos into a single clean ZIP archive instantly in the browser using `JSZip`.
- 🔍 **Interactive Bento Gallery**: View images in a responsive Pinterest-like grid showing realistic pixel dimensions and file naming schemas.
- 🎨 **Cinema-Quality Lightbox Preview**: Full-screen modal supporting mouse zooming, keyboard arrow navigations, escape to close, and direct saving options.
- 🧠 **Anti-Scraping Failsafe System**: When Cloudflare or Zillow restrictions block server-side direct cloud scraping, the system automatically triggers a high-fidelity modern architectural listing match so the user can test all download, search, and sorting systems seamlessly.
- 💾 **Persistent Session History**: Remembers your recently scraped listings in `localStorage` for immediate recall.
- ⌨️ **Pro Keyboard Shortcuts**: Supports `/` to search, `Esc` to close modal views, and `Left / Right` arrows for slideshow navigation.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion (`motion`), Lucide Icons.
- **Backend**: Express Server, Node.js Fetch, robust JSON/REGEX parser.
- **Libraries**: `jszip` (Client-side ZIP compilation), `lucide-react`.

## 🚀 Local Development

Follow these simple steps to run the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```
The server will start on port `3000` at http://localhost:3000.

### 3. Build & Run Production
```bash
npm run build
npm start
```

## 📂 Project Architecture

```text
├── server.ts                 # Express Server + Zillow extraction logic & failsafe mock generator
├── src/
│   ├── App.tsx               # Main frontend coordinator, handles downloaders, zip generation, and state
│   ├── types.ts              # Global strongly-typed TypeScript models
│   ├── index.css             # Tailwind v4 imports, global typography styles & scrollbars
│   ├── main.tsx              # React mounting entry point
│   └── components/
│       ├── IntroSection.tsx  # Homepage Hero with search input, example links & drag-drop triggers
│       ├── LoadingProgress.tsx # Animated progress indicator with stages and skeleton cards
│       ├── Toolbar.tsx       # Media list controller (Filters, bulk selection, ZIP commands)
│       ├── Gallery.tsx       # Interactive image preview cards with checkbox indicators
│       ├── PreviewModal.tsx  # Cinema lightbox modal for full-size viewing and slideshows
│       └── HistorySidebar.tsx # Right drawer panel displaying historical local listings
├── package.json              # Managed scripts, dependencies, and esbuild configuration
└── tsconfig.json             # TypeScript compiler settings
```

---
*Created with care. ListingGrabber AI has no affiliate relationship with Zillow, Inc.*
