# ☕ Kanchi Cafe – Smart QR Ordering & POS System

A modern, full-stack Cafe Management, Point of Sale (POS), and QR-Based Food Ordering System designed to simplify cafe operations and provide customers with a seamless digital ordering experience.

🌐 **Live Demo:** https://smartqrorderingsystem.vercel.app

📂 **GitHub Repository:** https://github.com/roopasanthoshi/SmartQrOrderingSystem

---

## 📌 Project Overview

Kanchi Cafe is a smart cafe management solution that combines digital ordering and POS functionality into one platform.

Customers can scan QR codes placed on their tables, browse the digital menu, and place orders without waiting for manual assistance.

The admin dashboard provides a centralized interface to manage cafe operations, menu items, and orders.

The application is designed with a premium cafe-inspired user interface and a responsive design.

## ✨ Key Features

### 🛒 Customer Ordering
- QR-based table ordering.
- Digital food menu.
- Easy menu browsing.
- Table-specific ordering experience.
- Responsive customer interface.

### 📊 Admin Dashboard
- Centralized admin dashboard.
- Menu management.
- Order management.
- Cafe operations overview.
- Secure admin authentication.

### 🧾 POS System
- Digital order processing.
- Streamlined cafe order management.
- Integrated customer ordering workflow.

### ☁️ Cloud Integration
- PostgreSQL database hosted on Neon.
- Cloudinary integration for media management.
- JWT-based authentication.
- Cloud deployment using Vercel.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Authentication | JWT |
| Media Storage | Cloudinary |
| Deployment | Vercel |
| Version Control | Git & GitHub |

## 🏗️ Project Architecture

The project follows a full-stack architecture with separate frontend and backend services.

- **Frontend:** React application responsible for the customer interface and admin dashboard.
- **Backend:** Express API responsible for application logic and database operations.
- **Database:** PostgreSQL stores application data.
- **Cloud Storage:** Cloudinary handles media assets.

## 📁 Project Structure

```text
SmartQrOrderingSystem/
│
├── api/
│
├── kanchi_cafe_ui/
│   ├── backend/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── frontend/
│       ├── src/
│       ├── public/
│       └── package.json
│
├── vercel.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/roopasanthoshi/SmartQrOrderingSystem.git
```

### 2. Navigate to the Project

```bash
cd SmartQrOrderingSystem
```

### 3. Setup Backend

```bash
cd kanchi_cafe_ui/backend
npm install
```

Configure the backend environment variables in the `.env` file.

### 4. Setup Frontend

Open another terminal:

```bash
cd kanchi_cafe_ui/frontend
npm install
```

Configure the frontend environment variables.

### 5. Run the Application

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm run dev
```

The frontend and backend will run on their configured local development ports.



### Frontend

```env
VITE_API_URL=/api
```

**Important:** Never upload actual `.env` files, database passwords, API secrets, or JWT secrets to GitHub.

## 🚀 Deployment

The application is configured for deployment using Vercel.

Deployment architecture:

- Frontend: React + Vite.
- Backend: Express service.
- Database: Neon PostgreSQL.
- Media storage: Cloudinary.
- Hosting: Vercel.

The root `vercel.json` configures the frontend and backend services and their routing.

## 🎯 Project Objectives

- Simplify traditional cafe ordering processes.
- Reduce manual order-taking.
- Introduce QR-based digital ordering.
- Provide centralized cafe management.
- Improve operational efficiency.
- Deliver a smooth customer experience.

## 🔮 Future Enhancements

- Online payment gateway integration.
- Real-time order notifications.
- Sales analytics and reports.
- Customer order history.
- Advanced inventory management.
- Customer feedback and ratings.

## 👩‍💻 Developer

**Developed by:** Roopa Santhoshi Mandava

**Project:** Kanchi Cafe – Smart QR Ordering & POS System

**GitHub:** https://github.com/roopasanthoshi

---

⭐ If you find this project interesting, consider giving the repository a star!

