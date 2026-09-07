# 🌟 StoreRate - FullStack Store Rating Platform

A fullstack web application built according to the **Company Coding Challenge** specifications. It provides a unified platform where shoppers can discover stores and submit/modify 1–5 star ratings, store owners can track customer ratings & analytics, and system administrators have complete control over stores and users.

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database & ORM**: Prisma ORM with SQLite (zero-config, immediately runnable; ready for PostgreSQL / MySQL via `.env`)
- **Frontend**: React 18 (Vite) + TypeScript + Tailwind CSS + Lucide Icons + Axios
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing & role-based middleware

---

## 👥 User Roles & Capabilities

| Role | Key Capabilities |
| :--- | :--- |
| **System Administrator** | • Dashboard with metrics: Total Users, Total Stores, Total Ratings & Role breakdown<br>• Add new stores, normal users, and admin users<br>• View all stores with Name, Email, Address, Overall Rating, and Owner<br>• View all users with Name, Email, Address, Role, and Store Owner ratings<br>• Multi-field filters & sorting (asc/desc) across all tables<br>• View complete user details & associated store reviews |
| **Normal User** | • Register account with real-time validation<br>• Single unified login system<br>• View and search all registered stores by Name and Address<br>• Sort stores by Name, Address, Rating<br>• Submit individual ratings (1 to 5 stars) with interactive star picker<br>• Modify previously submitted ratings anytime<br>• Update password after login |
| **Store Owner** | • Dashboard showing assigned store details and overall average rating<br>• View list of users who submitted reviews for their store with rating score and timestamp<br>• Sort reviewer history by Name, Email, Rating, or Date<br>• Update password after login |

---

## 🔒 Form Validation Rules (Strictly Enforced on Client & Backend)

- **Name**: Minimum **20** characters, Maximum **60** characters.
- **Address**: Maximum **400** characters.
- **Password**: **8–16** characters, must contain at least **one uppercase letter** (`[A-Z]`) and **one special character** (`[!@#$%^&*...]`).
- **Email**: Standard RFC email format validation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed      # Seeds demo users, stores, and ratings
npm run dev          # Starts backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Starts frontend on http://localhost:5173
```

---

## 🔑 Pre-seeded Demo Accounts (Quick 1-Click Login Available)

All accounts use the password: `Password@123`

| Role | Email | Name | Notes |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin@example.com` | `System Administrator Root` | Full system control & stats |
| **🏪 Store Owner 1** | `owner1@example.com` | `Store Owner Michael Scott` | Owner of *Tech Haven Electronics* |
| **🏪 Store Owner 2** | `owner2@example.com` | `Store Owner Samantha Green` | Owner of *Fresh Garden Grocery* |
| **👤 Normal User 1** | `user1@example.com` | `Normal User Jonathan Doe` | Submitted ratings on multiple stores |
| **👤 Normal User 2** | `user2@example.com` | `Normal User Emily Clark` | Active reviewer |
| **👤 Normal User 3** | `user3@example.com` | `Normal User Robert Smith` | Active reviewer |

> 💡 **Tip**: The login page includes 1-click quick login buttons for Admin, Store Owner, and Normal User for seamless testing!

---

## 📡 REST API Overview

### Authentication
- `POST /api/auth/register` - Normal user signup
- `POST /api/auth/login` - Unified login for all roles
- `GET /api/auth/me` - Authenticated user profile
- `PUT /api/auth/change-password` - Password change with validation

### Administrator (`role: ADMIN`)
- `GET /api/admin/dashboard-stats` - Total count of users, stores, and ratings
- `POST /api/admin/stores` - Create new store
- `GET /api/admin/stores` - List all stores with filtering & sorting
- `POST /api/admin/users` - Create new user (Admin, Normal User, Store Owner)
- `GET /api/admin/users` - List all users with filtering & sorting (includes store rating for owners)
- `GET /api/admin/users/:id` - User detail inspector
- `GET /api/admin/store-owners` - List potential store owners

### Normal User (`role: USER`)
- `GET /api/user/stores` - List stores with overall rating and user's submitted rating (search by name & address)
- `POST /api/user/ratings` - Submit or modify rating (1 to 5)

### Store Owner (`role: STORE_OWNER`)
- `GET /api/store-owner/dashboard` - Store metrics and reviewer rating history