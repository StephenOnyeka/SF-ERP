# SForger ERP – Backend

## Overview

The Backend of SForger ERP is a robust RESTful API server that handles authentication, business logic, and data persistence for the ERP system. It is designed for scalability, security, and easy integration with the frontend and other services.

---

## Features

- Secure user authentication with JWT and Passport.js
- Role-based access control (Admin, HR, Employee)
- Employee, attendance, leave, and payroll management endpoints
- MongoDB integration via Mongoose for persistent storage
- Data validation with Zod
- Modular route and middleware structure
- Seed scripts for demo data

---

## Tech Stack

- **Framework:** Express.js
- **Language:** TypeScript (and JavaScript)
- **Authentication:** Passport.js, JWT
- **Database:** MongoDB, Mongoose
- **Validation:** Zod
- **Environment:** dotenv
- **Dev Tools:** Nodemon

---

## Project Structure

```
Backend/
│
├── models/           # Mongoose models
├── routes/           # Express route handlers
├── middleware/       # Express middleware
├── scripts/          # Utility scripts (e.g., seed users)
├── app.js            # Main backend entry point
├── index.js          # Alternative backend entry point
├── package.json      # Backend dependencies and scripts
└── ...               # Other config files
```

---

## Setup & Installation

### 1. Install Node.js and npm
- Download and install Node.js (v18 or higher) from [nodejs.org](https://nodejs.org/).

### 2. Install MongoDB
- Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community).
- Start the MongoDB server locally or use a remote instance.

### 3. Install Dependencies
```bash
cd Backend
npm install
```
This will install all required packages (Express, Mongoose, Passport.js, etc.).

### 4. Configure Environment Variables
Create a `.env` file in the `Backend` folder:
```
MONGODB_URI=mongodb://localhost:27017/sforger-erp
PORT=5000
JWT_SECRET=your-secret-key
```
- Adjust `MONGODB_URI` if your MongoDB server is running elsewhere.

---

## Running in Development Mode

```bash
npm run dev
```
- The server will run on [http://localhost:5000](http://localhost:5000) (or as configured).
- API endpoints are available under `/api/*`.

---

## Seeding Demo Data

To create demo users in MongoDB for testing:

```bash
npm run seed
```

---

## Troubleshooting

- If you encounter missing module errors, ensure you have run `npm install` in the `Backend` directory.
- For environment variable issues, double-check your `.env` file and variable names.
- For database connection issues, ensure your MongoDB server is running and accessible.

---

## Support

For issues, please [Open an issue](https://github.com/jainish2001/SForger-ERP/issues) or email us at support@sforgererp.com

This project is private and not licensed for public or commercial use.

---

Happy coding! 
