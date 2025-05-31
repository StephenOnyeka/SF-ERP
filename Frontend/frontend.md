# SForger ERP – Frontend

## Overview

The Frontend of SForger ERP is a modern, responsive web application built with React and TypeScript. It provides a seamless user experience for managing employees, attendance, leave, payroll, and analytics, and is designed for scalability and maintainability.

---

## Features

- User authentication and role-based access (Admin, HR, Employee)
- Employee dashboard with real-time attendance and leave balance
- Attendance management and reporting
- Leave application and approval workflows
- Payroll summary and exportable reports
- Admin panel for employee and policy management
- Responsive UI with modern design and accessibility

---

## Tech Stack

- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS, Radix UI
- **State/Data:** TanStack Query, React Context
- **Forms & Validation:** React Hook Form, Zod
- **API:** RESTful, fetch/axios
- **Other:** Drizzle ORM (PostgreSQL), Passport.js (for session management), Framer Motion, Lucide Icons

---

## Project Structure

```
Frontend/
│
├── client/           # React app source code
│   ├── src/          # Main source files (pages, components, hooks, etc.)
│   ├── public/       # Static files
│   └── index.html    # Main HTML entry
│
├── server/           # Express server for API and SSR
│   ├── routes/       # API route handlers
│   ├── middleware/   # Express middleware
│   └── ...           # Other server files
│
├── shared/           # Shared types and schema
├── attached_assets/  # Documentation and assets
├── package.json      # Frontend dependencies and scripts
└── ...               # Config files (Vite, Tailwind, Drizzle, etc.)
```

---

## Setup & Installation

### 1. Install Node.js and npm
- Download and install Node.js (v18 or higher) from [nodejs.org](https://nodejs.org/).

### 2. Install Dependencies
```bash
cd Frontend
npm install
```
This will install all required packages (React, Vite, TailwindCSS, etc.).

### 3. Configure Environment Variables
Create a `.env` file in the `Frontend` folder:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sforger_erp
SESSION_SECRET=your-session-secret
NODE_ENV=development
```
- Replace `user` and `password` with your PostgreSQL credentials.

### 4. (Optional) Setup PostgreSQL
- If using Drizzle ORM features, ensure PostgreSQL is running and the database exists.

---

## Running in Development Mode

```bash
npm run dev
```
- The app will be available at [http://localhost:5000](http://localhost:5000) (or as configured).
- API and client are served from the same port for convenience.

---

## Troubleshooting

- If you encounter missing module errors, ensure you have run `npm install` in the `Frontend` directory.
- For environment variable issues, double-check your `.env` file and variable names.
- For database connection issues, ensure your PostgreSQL server is running and accessible.

---

## Support

For issues, please [Open an issue](https://github.com/jainish2001/SForger-ERP/issues) or email us at support@sforgererp.com

This project is private and not licensed for public or commercial use.

---

Happy coding! 
