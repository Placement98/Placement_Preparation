# 🚀 AI Placement Preparation Platform

### 🎯 Personalized AI-Powered Placement Preparation Platform
🚀 Overview

AI Placement Preparation Platform is a full-stack MERN application that helps students prepare for placements through adaptive aptitude, technical, and DSA practice. The system automatically analyzes student weaknesses, generates personalized quizzes using AI, evaluates coding submissions with Judge0, and sends daily practice links through email.

The platform focuses on personalized preparation instead of generic question practice.
# ✨ Features

## 👨‍🎓 Student Features

* 🔐 JWT Authentication System
* 🧠 AI-Generated Adaptive Quizzes
* 📧 Daily Quiz Email Delivery
* 💻 DSA Coding Practice
* ⚡ Real-time Code Execution
* 📊 Performance Analytics Dashboard
* 🎯 Weak Topic Detection
* 🏆 Leaderboard System
* 📈 Progress Tracking
* 📝 Coding Test Evaluation
* 📬 Personalized Quiz Links

---

## 🤖 AI Features

* AI-generated aptitude questions
* AI-generated technical MCQs
* Personalized quizzes based on weak areas
* Automated answer evaluation
* Adaptive next-day quiz generation
* AI explanations and feedback

---

## 💻 Coding Platform Features

* Monaco Code Editor
* Judge0 API Integration
* Multi-language execution
* Public & Hidden Test Cases
* Runtime & Memory Analysis
* Coding Score Evaluation

---

# 🏗️ System Workflow

```text id="fqteqo"
Student Signup
      ↓
Profile & Weakness Analysis
      ↓
Daily Cron Job Runs
      ↓
AI Generates Personalized Quiz
      ↓
Quiz Sent Through Email
      ↓
Student Attempts Questions
      ↓
Judge0 Executes DSA Code
      ↓
AI Evaluates Answers
      ↓
Weak Topics Detected
      ↓
MongoDB Updated
      ↓
Next Adaptive Quiz Generated
```

---

# 🛠️ Tech Stack

| Technology            | Purpose            |
| --------------------- | ------------------ |
| React 19 + Vite       | Frontend           |
| Node.js + Express     | Backend            |
| MongoDB Atlas         | Database           |
| JWT + bcrypt          | Authentication     |
| Grok API / Gemini API | AI Quiz Generation |
| Judge0 API            | Code Execution     |
| Brevo API             | Email Delivery     |
| Monaco Editor         | Coding Editor      |
| Cloudinary            | File Storage       |
| Render                | Deployment         |
| Node Cron             | Scheduled Jobs     |

---

# 📂 Project Structure

```bash id="w6hrh2"
placement-prep/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── main.jsx
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
└── README.md
```

---

# ⚙️ Installation Guide

# 1️⃣ Clone Repository

```bash id="t8avvw"
git clone https://github.com/Placement98/AI_Placement_Preparation.git
cd AI_Placement_Preparation
```

---

# 2️⃣ Install Frontend Dependencies

```bash id="m5mg2l"
cd client
npm install
```

---

# 3️⃣ Install Backend Dependencies

```bash id="klp1vl"
cd ../server
npm install
```

---

# 🔑 Environment Variables Setup

Create `.env` inside `server/`

```env id="bmstfv"
PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

GROK_API_KEY=your_grok_api_key
GEMINI_API_KEY=your_gemini_api_key

BREVO_API_KEY=your_brevo_api_key

JUDGE0_API_KEY=your_judge0_api_key
JUDGE0_URL=your_judge0_url

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# 🚀 Running the Project

## Start Backend

```bash id="k0h31k"
cd server
npm run dev
```

---

## Start Frontend

Open another terminal:

```bash id="7mzkml"
cd client
npm run dev
```

---

# 🌐 Frontend URL

```text id="i9n6ae"
http://localhost:5173
```

# 🌐 Backend URL

```text id="iwkw9x"
http://localhost:5000
```

---

# 📧 Daily Quiz Automation

The platform uses:

* ⏰ Node Cron for scheduling
* 📧 Brevo API for email delivery
* 🤖 Grok/Gemini API for quiz generation

Daily workflow:

```text id="1s8qmw"
8:00 AM Cron Job
      ↓
Generate Adaptive Quiz
      ↓
Send Quiz Email
      ↓
Student Attempts Quiz
      ↓
Evaluate Performance
      ↓
Update Weak Topics
```

---

# 💻 DSA Coding Execution

## Judge0 Workflow

```text id="zh66h0"
Student Writes Code
      ↓
Code Sent To Judge0 API
      ↓
Judge0 Executes Test Cases
      ↓
Results Returned
      ↓
Score Generated
```

---

# 🔐 Security Features

* JWT Authentication
* bcrypt Password Hashing
* Protected API Routes
* Rate Limiting
* Input Validation
* Secure Environment Variables

---

# 📊 Dashboard Features

* Accuracy Tracking
* Topic-wise Analytics
* Coding Performance
* Quiz History
* Weak Topic Monitoring
* Leaderboard Rankings

---

# 🚀 Deployment Guide

## Frontend Deployment

* Vercel
* Render
* Netlify

## Backend Deployment

* Render
* Railway

## Database

* MongoDB Atlas

---

# 🔮 Future Enhancements

* 🎤 AI Mock Interviews
* 📄 Resume Analyzer
* 🧠 AI Career Roadmap
* 📱 WhatsApp Notifications
* 🏢 Company-Specific Preparation
* 🧪 Online Coding Contests
* 🤝 Peer Competitions
* 📹 Video Interview Simulator

---


---

# 📜 License

This project is licensed under the MIT License.

---

<div align="center">

## ⭐ Support The Project

If you like this project, give it a ⭐ on GitHub.

</div>
