# New Billionaires POS

New Billionaires POS is a full-stack point of sale and inventory system for a bar and food service business. It supports cashier sales, admin stock control, menu management, user accounts, sales history, and reporting.

## Main Features

- Login with JWT authentication.
- Role-based access for `sudo_admin`, `admin`, and `cashier`.
- Cashier POS screen for bar products and food menu items.
- Checkout with cash or M-Pesa payment method.
- Sales history with date filters and receipt-style sale details.
- Product and drink stock management.
- Food ingredient stock management with stock-in and kitchen-release tracking.
- Food menu management.
- Admin reports for revenue, payments, products, food, cashiers, stock, and ingredient movements.
- Responsive React interface with dashboard, sidebar, and protected routes.

## Tech Stack

- Frontend: React, Vite, React Router DOM, React Icons.
- Backend: Node.js, Express.js, JWT, bcrypt.
- Database: MySQL using `mysql2/promise`.

## Project Structure

- `frontend/` - React/Vite application.
- `backend/` - Express API.
- `database/migrations/` - Available database migration scripts.
- `TASKS.md` - Completed work and remaining tasks.
- `PROJECT_STATUS.md` - Current project status.
- `NEXT_STEPS.md` - Recommended next technical steps.
- `MANAGER_GUIDE.md` - Simple user manual for managers.

## Setup

Install dependencies separately for the frontend and backend:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create a backend `.env` file with your database and JWT settings:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pos_system
JWT_SECRET=replace_with_a_strong_secret
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

The frontend expects `VITE_API_URL` to point to the backend API base URL, for example:

```bash
VITE_API_URL=http://localhost:5000/api
```

## API Overview

- `POST /api/auth/login` - login.
- `POST /api/auth/register` - sudo-admin-only user registration endpoint.
- `/api/products` - product CRUD for POS products.
- `/api/sales` - create sales and view sales history.
- `/api/reports` - admin reports.
- `/api/stock` - product stock management.
- `/api/ingredient-stock` - food ingredient stock management.
- `/api/menu` - food menu management.
- `/api/users` - admin user management.

## Verification

Current checks pass:

```bash
cd frontend
npm run lint
npm run build

cd ..
find backend/src -name '*.js' -print -exec node --check {} \;
```

## Notes

- The migrations folder currently contains partial migration scripts, not a full database schema export.
- Set a real `JWT_SECRET` before production use.
- Product profit reports use the current product cost price. For strict historical accounting, sale items should store cost price at sale time.

## Author

Francis Bosire
