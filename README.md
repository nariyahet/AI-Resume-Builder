# 🚀 AI-Powered Resume Builder & ATS Studio

A full-stack, production-ready AI Resume Maker built with **React.js + Vite**, **Node.js + Express.js**, **MySQL**, **JWT + bcrypt**, and **Google Gemini API**.

---

## ✨ Features

- **⚡ 1-Click AI Full Resume Generator:** Paste your raw bio or work notes and let Google Gemini transform them into a complete structured resume.
- **✨ AI Summary Enhancer:** Craft an impactful, ATS-tailored executive summary with 1 click.
- **✨ AI Bullet Polisher (STAR Method):** Rewrites rough daily responsibilities into punchy, metric-driven achievements using action verbs.
- **🎯 ATS Score & Keyword Audit:** Real-time ATS match percentage, keyword analysis, and 1-click skill injection.
- **📄 Pixel-Perfect A4 Vector PDF Export:** High-resolution PDF generation with zero watermark.
- **🎨 3 ATS-Friendly Templates:** Modern Tech, Executive Corporate, and Minimalist.
- **🎨 Theme Customization:** Instant color palette switcher (Royal Blue, Emerald, Crimson, Indigo, Slate).
- **🔒 Full User Authentication:** Register & login with JWT tokens and bcrypt password encryption.
- **💾 MySQL Persistence:** Store multiple resumes, update anytime, with local storage auto-save fallback.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Modern CSS (Glassmorphism & Print Engine), Lucide Icons |
| **Backend** | Node.js, Express.js, CORS, Dotenv |
| **Database** | MySQL 8.0 (`mysql2` connection pool) |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **AI Integration** | Google Gemini API (Gemini 1.5 / 2.5 Flash) with fallback engine |
| **PDF Generation** | `html2pdf.js` + Native CSS Print Engine |

---

## 🚀 Getting Started

### 1. Backend Server Setup
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_resume_db
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key  # Optional: Can also be set directly in frontend UI
```

Start Backend:
```bash
npm run dev
# or
node server.js
```
The server runs on **`http://localhost:5000`**. It automatically creates the database `ai_resume_db` and tables (`users`, `resumes`) on startup.

---

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Setting up Google Gemini API Key
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Either add it to `server/.env` as `GEMINI_API_KEY=AIza...` OR click **"AI Settings"** in the top navbar inside the app and paste it directly!
