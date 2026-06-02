# New Billionaires POS Frontend

React/Vite frontend for the New Billionaires POS system.

## Pages

- Login.
- Dashboard.
- POS / New Sale.
- Sales History and My Sales.
- Products.
- Stock Management.
- Food Menu.
- Reports.
- Users.

## Setup

```bash
npm install
```

Create a frontend environment file if needed:

```bash
VITE_API_URL=http://localhost:5000/api
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Notes

- Cashiers mainly use POS and My Sales.
- Admins and sudo admins can access stock, products, menu, reports, and users.
- The frontend stores the session token and user details in `sessionStorage`.
