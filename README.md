# 🎬 IMDb Watchlist Organizer

A sleek, responsive React + Tailwind web app for viewing and filtering your personal IMDb watchlist — styled like IMDb, with powerful search, filters, and sorting options.

---

## 🚀 Features

- 🖼 IMDb-style card layout
- 🔍 Search by title
- 🏷️ Filter by:
  - Genre
  - Type (movie, tvSeries, etc.)
  - Release status (released/unreleased)
- 📊 Sort by:
  - IMDb rating
  - Runtime
  - Alphabetical
- 💡 Responsive & mobile-ready
- 🔥 Firebase-ready deploy

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/all-i-hop/imdb-firebase-organizer.git
cd imdb-firebase-organizer
```

### 2. Install dependencies

```bash
npm install
```

---

## 📁 Add Your IMDb Data

### Step 1: Export your IMDb Watchlist
Use a Node.js script (or Puppeteer) to extract your watchlist into JSON format.

### Step 2: Place the file here:

```
/public/watchlist_flat.json
```

⚠️ This file is excluded from version control via `.gitignore`.

---

## 💻 Run Locally

```bash
npm run dev
```

Open in your browser: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Sample Data Format

```json
[
  {
    "title": "Oppenheimer",
    "year": 2023,
    "runtimeMinutes": 180,
    "rating": "R",
    "type": "movie",
    "imdbRating": 8.7,
    "voteCount": 250000,
    "genres": "Biography, Drama, History",
    "cast": "Cillian Murphy, Emily Blunt",
    "directors": ["Christopher Nolan"],
    "plot": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    "poster": "https://link-to-poster.jpg",
    "link": "https://www.imdb.com/title/tt15398776/"
  }
]
```

---

## 🔥 Firebase Hosting Deployment

### ✅ One-time Setup

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Log into Firebase

```bash
firebase login
```

#### 3. Initialize Firebase (in project root)

```bash
firebase init
```

- Choose: **Hosting**
- Use: **an existing project** or create one in Firebase Console
- Set `dist` as the public folder
- **Do not** configure as SPA (choose "No" for rewrite to `index.html`)
- Skip `firebase deploy` at the end

---

### 🚀 Deploy Your App

#### 1. Build the project

```bash
npm run build
```

#### 2. Deploy to Firebase Hosting

```bash
firebase deploy
```

#### 3. 🎉 You're Live!

Firebase will give you a public URL like:

```
✔  Hosting URL: https://your-project.web.app
```

---

## 🧰 Scripts

| Command            | Description                |
|--------------------|----------------------------|
| `npm run dev`      | Start dev server           |
| `npm run build`    | Build for production       |
| `firebase deploy`  | Upload to Firebase Hosting |

---

## 📦 Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Hosting](https://firebase.google.com/)

---

## 🛡 .gitignore Highlights

```gitignore
node_modules/
dist/
.firebase/
.env*
/public/watchlist_flat.json
```

---

## 📄 License

MIT — free to use, modify, and deploy.