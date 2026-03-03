# 🌟 Nova AI - Multi-AI Chat Platform

A beautiful multi-AI chat platform with 7 unique AI companions, voice synthesis, and email verification.

![Nova AI](https://img.shields.io/badge/Status-Beta%20Testing-purple) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🤖 7 Unique AI Companions
| AI | Personality | Specialty |
|---|---|---|
| **Nova** | Friendly & Warm | General assistance |
| **Echo** | Curious & Analytical | Research & analysis |
| **Atlas** | Wise & Knowledgeable | Learning & education |
| **Orion** | Creative & Imaginative | Creative writing |
| **Luna** | Gentle & Empathetic | Emotional support |
| **Spark** | Energetic & Playful | Fun conversations |
| **Zen** | Calm & Thoughtful | Mindfulness |

### 💬 Chat Modes
- **Personal Chat** - One-on-one with your chosen AI
- **Group Chat** - Multiple AIs respond to your message

### 🔊 Voice Features
- Text-to-speech for AI responses
- 7 unique voices for each AI
- Adjustable voice settings

### 🔐 Security
- Email verification for sign-up
- 2FA-style verification for sign-in
- Secure authentication with NextAuth.js

### 📱 Responsive Design
- Mobile-first design
- Works on all devices
- Beautiful dark theme

## 🚀 Live Demo

**Currently in Beta Testing - All Features FREE!**

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Prisma ORM with SQLite
- **Auth**: NextAuth.js with email verification
- **AI**: z-ai-web-dev-sdk
- **Email**: Nodemailer with Gmail SMTP

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/jaytraveler/nova-ai.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## ⚙️ Environment Variables

```env
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Gmail SMTP for email verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Nova AI <your-email@gmail.com>
```

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

Created by **jaytraveler**

---

⭐ If you like this project, give it a star!
