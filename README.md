# SplitLedger — Expense Splitter

A full-stack MERN application for managing shared expenses in groups. It helps track who paid, who owes, and simplifies settlements so everything stays clear and fair.

---

## Why I Built This

While going out with friends or traveling in groups, managing expenses often became confusing. Someone pays for food, someone books tickets, and later it’s hard to figure out who owes what.

Most tools felt either too complicated or unnecessary for small use cases. I wanted something simple, clean, and practical that solves this problem without extra steps.

SplitLedger is built with that idea in mind — keep things clear, minimal, and useful.

---

## Features

* Secure authentication using JWT (signup and login)
* Create groups and add members by searching email
* Add, edit, and delete expenses
* Split expenses equally or with custom amounts
* Automatic balance calculation for each user
* Settlement system that minimizes transactions
* Dashboard with balances, charts, and activity feed
* Export settlements as PDF
* Share summaries via WhatsApp
* Profile page to update name and password
* Toast notifications for user actions
* Fully responsive design

---

## Tech Stack

| Layer    | Technology                   |
| -------- | ---------------------------- |
| Frontend | React 18, Vite, React Router |
| Backend  | Node.js, Express             |
| Database | MongoDB Atlas, Mongoose      |
| Auth     | JWT, bcryptjs                |
| Charts   | Recharts                     |
| PDF      | jsPDF, jspdf-autotable       |
| Icons    | lucide-react                 |

---

## Project Structure

```
expense-splitter/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
├── .gitignore
└── README.md
```

---

## How Settlement Works

The goal is to reduce multiple debts into the smallest number of transactions.

Each user’s balance is calculated based on how much they paid versus how much they owe. Users with positive balances should receive money, and those with negative balances need to pay.

The system matches the largest debtor with the largest creditor and transfers the minimum possible amount between them. This continues until all balances are settled.

This approach keeps the process efficient and easy to understand.

---

## Setup

### Prerequisites

* Node.js (v18 or higher)
* MongoDB Atlas account

---

### Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
PORT=5000
```

Start the backend:

```bash
npm run dev
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

### Open the App

```
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint                | Description      |
| ------ | ----------------------- | ---------------- |
| POST   | /api/auth/signup        | Register user    |
| POST   | /api/auth/login         | Login            |
| GET    | /api/auth/me            | Get current user |
| PUT    | /api/auth/me            | Update profile   |
| GET    | /api/auth/users         | Search users     |
| GET    | /api/groups             | Get groups       |
| POST   | /api/groups             | Create group     |
| POST   | /api/groups/:id/members | Add member       |
| DELETE | /api/groups/:id         | Delete group     |
| GET    | /api/expenses           | Get expenses     |
| POST   | /api/expenses           | Add expense      |
| PUT    | /api/expenses/:id       | Edit expense     |
| DELETE | /api/expenses/:id       | Delete expense   |
| GET    | /api/settlements        | Get settlements  |

---

## Future Improvements

* UPI integration for direct payments
* Recurring expenses (rent, subscriptions)
* Email notifications
* Receipt uploads
* Better analytics and spending insights

---

## License

MIT
