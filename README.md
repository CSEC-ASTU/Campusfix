# 🛠️ Campus Fix

**Bridging the gap between students and campus maintenance through real-time, intelligent reporting.**

---

## 📌 Overview

University life should be about learning—not chasing unresolved maintenance issues.
**Campus Fix** is a modern web-based platform that replaces outdated manual reporting systems with a fast, transparent, and intelligent digital solution.

Students can report infrastructure issues in real time, while administrators and technicians manage, track, and resolve problems efficiently through a centralized system.

---

## 🛑 The Problem

Traditional dormitory maintenance relies on verbal complaints or paper-based logs, which leads to:

* **Delayed Responses** – Issues remain unresolved for long periods
* **Information Loss** – Reports are misplaced or forgotten
* **No Transparency** – Students cannot track issue status
* **Safety & Productivity Risks** – Broken infrastructure affects health and academic focus

---

## ✅ The Solution

**Campus Fix** provides a centralized and intelligent facility management platform:

* 📢 Real-time issue reporting
* 🔍 Live progress tracking
* 🧑‍💼 Admin & technician dashboards
* 💬 Real-time messaging
* 🤖 AI-powered assistance

---

## 🚀 Key Features & Roadmap

We are building more than a reporting tool — we are building an **intelligent campus ecosystem**.

* 🤖 **AI-Powered Support (RAG)**
  The Campus Fix AI Agent analyzes reported issues and suggests quick fixes for minor problems. If unresolved, issues are escalated to administrators.

* ⚙️ **Smart Task Allocation**
  Automatically assigns technicians while allowing manual assignment.

* 💬 **Real-Time Interaction**
  WebSocket-based live updates and messaging for students, admins, and technicians.

* 🔐 **Secure Authentication**
  Google OAuth and session-based authentication.

* 📈 **Scalable Architecture**
  Designed to scale from a single dormitory to a full university network.

---

## 🧱 Project Structure

```
Campusfix/
│
├── public/                 # Frontend (HTML Pages)
│   ├── index.html
│   ├── Howtouse.html
│   ├── aibot.html
│   ├── adminlogin.html
│   ├── admindashboard.html
│   ├── studentlogin.html
│   ├── studentdashboard.html
│   ├── technicaldashboard.html
│   └── message.html
│
├── server.js               # Backend server
├── db.js                   # Database configuration
├── auth.js                 # Authentication logic
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 🖥️ Pages Overview (Located in `public/`)

* **index.html** – Landing and navigation page
* **Howtouse.html** – Step-by-step workflow of the system
* **aibot.html** – AI assistant interface
* **adminlogin.html** – Admin authentication
* **admindashboard.html** – Admin dashboard & analytics
* **studentlogin.html** – Student authentication
* **studentdashboard.html** – Student issue tracking
* **technicaldashboard.html** – Technician task management
* **message.html** – Real-time communication

---

## ▶️ How to Run Campus Fix (Local Setup)

This guide explains how to run **Campus Fix** locally and configure the AI integration using **OpenRouter AI**.

### 🔹 Prerequisites

* Node.js (v18 or later)
* npm
* Git
* A configured database
* An OpenRouter AI API key

---

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/CSEC-ASTU/Campusfix.git
cd Campusfix
```

---

### 🔹 2. Install Dependencies

```bash
npm install
```

---

### 🔹 3. Add Your OpenRouter AI API Key

Create a `.env` file in the project root:

```env
PORT=3000
SESSION_SECRET=your_session_secret
DATABASE_URL=your_database_connection_string

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=deepseek/deepseek-chat
```

Get your API key from: [https://openrouter.ai](https://openrouter.ai)

⚠️ **Never commit your `.env` file to GitHub**

---

### 🔹 4. Start the Server

```bash
npm start
```

or (development mode):

```bash
npm run dev
```

---

### 🔹 5. Access the Application

Open your browser and visit:

```
http://localhost:3000
```

All frontend pages are served from the **`public/`** folder.

---

## 🧭 How to Use Campus Fix

### 👨‍🎓 For Students

1. Log in via **Student Login**
2. Report an infrastructure issue
3. Track issue status in the dashboard
4. Receive real-time updates
5. Use the AI Assistant for guidance

---

### 🧑‍💼 For Administrators

1. Log in via **Admin Login**
2. View and manage reported issues
3. Assign technicians
4. Monitor progress
5. Communicate in real time

---

### 🧑‍🔧 For Technicians

1. Open the **Technical Dashboard**
2. View assigned tasks
3. Update task status
4. Communicate with admins

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript (served from `public/`)
* **Backend:** Node.js, Express
* **Database:** SQL-based
* **Authentication:** Google OAuth, Sessions
* **AI:** OpenRouter AI (RAG-based)
* **Real-Time:** WebSockets

---

## 🌍 Vision

Campus Fix aims to become a **standard digital infrastructure solution for universities**, improving safety, accountability, and student experience through intelligent systems.

---

## 🤝 Contributing

Contributions are welcome! Fork the repository, create a feature branch, and submit a pull request.

---

## 📜 License

This project is open-source and available under the **MIT License**.
