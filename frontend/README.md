# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Company Management System

A full-stack application to manage users and invoices with role-based authentication.

## Features

### Authentication
- Login with timezone validation
- JWT token based authentication

### Invoice Management
- Create, Read, Update, Delete invoices
- Unique invoice numbers per financial year
- Invoice date validation (between previous and next invoice)
- Search by invoice number
- Filter by financial year
- Filter by date range
- Pagination

### User Management
- Create, Read, Update, Delete users
- Role-based user creation (SUPER_ADMIN → ADMIN → UNIT_MANAGER → USER)
- Unique User ID generation (A1, UM1, U1)
- Sequential ID filling gaps after deletion
- Role change functionality

### Role Permissions

| Role | Can Do |
|------|--------|
| SUPER_ADMIN | Create ADMIN users, manage all users and invoices |
| ADMIN | Create UNIT_MANAGER users, change them to USER |
| UNIT_MANAGER | Create USER accounts |
| USER | Create and manage invoices only |

## Tech Stack

- **Frontend:** React.js, Axios, React Router
- **Backend:** Node.js, Express.js, MySQL, JWT
- **Database:** MySQL

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/company-management-system.git
cd company-management-system
CREATE DATABASE company_management;
USE company_management;

-- Create tables and insert users (run the schema.sql file)
Backend Setup

bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database password
node server.js
Frontend Setup

bash
cd frontend
npm install
npm run dev