# NEXT STEPS

## Current Focus

Prepare the system for real business use, handover, and deployment.

## Recommended Order

### Step 1: Database Setup File

Create one complete SQL setup file for a new installation. It should include all required tables, columns, indexes, and sample first-user instructions.

### Step 2: Production Environment

Set production environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `VITE_API_URL`

Use a strong `JWT_SECRET`.

### Step 3: Backups

Set up regular MySQL backups before the system is used for daily operations.

### Step 4: Testing

Add tests for the most important workflows:

- Login.
- New sale.
- Stock deduction.
- Product stock-in.
- Ingredient stock-in.
- Ingredient kitchen release.
- Reports date filters.
- User permissions.

### Step 5: Historical Profit Accuracy

For stricter accounting, store product cost price on each sale item at checkout time. Reports currently calculate bar profit using the current product cost price.

### Step 6: Deployment

Deploy frontend, backend, and database. After deployment, update `README.md` with live URLs and final setup notes.

## Long-Term Goal

Turn the project into a reliable daily POS and inventory platform for sales, stock control, staff accountability, and management reporting.
