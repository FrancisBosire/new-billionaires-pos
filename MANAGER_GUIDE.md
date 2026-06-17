# New Billionaires POS Manager Guide

This guide explains how to use the system in simple daily language.

---

## What The System Does

New Billionaires POS helps the business:
- Sell drinks and food.
- Track cash and M-Pesa sales.
- Reduce drink stock automatically when a sale is made.
- Track food ingredients added to stock.
- Track ingredients released to the kitchen.
- Show sales reports.
- Show cashier performance.
- Show low-stock items.
- Manage users.

---.

## User Roles

### Cashier

A cashier can:
- Make sales.
- Select cash or M-Pesa payment.
- View their own sales.

A cashier should not manage stock, reports, menu, or users.

### Admin

An admin can:
- View dashboard and reports.
- Manage products and stock.
- Manage food menu items.
- Manage food ingredients.
- Create cashier accounts.
- View sales history.

### Sudo Admin

A sudo admin has full control. This role can manage all users, including admins.

---

## 🚨 First-Time Setup (CRITICAL)

Before using the system for sales, the Sudo Admin must complete initial setup:

### 1. Verify and Update Stock Quantities
- Go to Stock Management → Products & Drinks
- For each drink, click "Record Stock In"
- Enter the actual physical count from your stock sheet
- Enter the cost price per unit

### 2. Set Minimum Stock Levels
- Edit each product
- Set a minimum stock level (e.g., 24 for cans, 12 for bottles)
- This enables low-stock alerts

### 3. Add Food Ingredients
- Go to Stock Management → Food Ingredients
- Add all ingredients you use in the kitchen
- Record initial stock quantities

### 4. Create User Accounts
- Go to Users
- Create accounts for all cashiers and admins
- Each person gets their own login

### 5. Test the System
- Log in as a cashier
- Make a test sale
- Verify stock is reduced correctly
- Check that the sale appears in reports

> The system is not ready for live sales until steps 1–4 are complete.

---

## Daily Cashier Work

### Making A Sale

1. Open POS / New Sale.
2. Select the drinks or food items the customer wants.
3. Adjust quantities if needed.
4. Choose payment method: Cash or M-Pesa.
5. Complete checkout.

After checkout:
- The sale is saved.
- Drink stock is reduced automatically.
- The sale appears in sales history and reports.

> Food menu items are sold from the menu list. Food ingredient stock is not reduced automatically by food sales; ingredients are controlled through kitchen release.

---

## Daily Manager Work

### Checking Sales

- Open Dashboard for a quick summary.
- Open Reports for more details.
- Use filters like Today, Last 7 Days, This Month, or This Year.

Reports show:
- Total revenue.
- Number of orders.
- Average order value.
- Cash and M-Pesa totals.
- Bar revenue.
- Food revenue.
- Top-selling products.
- Top-selling foods.
- Cashier performance.
- Stock and ingredient movements.

### Checking Cashier Sales

- Open Sales History.
- Filter by date.
- Open a sale to see the receipt details.

> Cashiers can use My Sales to view only their own sales.

---

## Managing Drink Stock

Use Stock Management, then choose Products & Drinks.

### ⚠️ IMPORTANT: Initial Stock Verification

I have bulk-imported all drinks into the system with zero stock and no cost prices set.

Before the system can be used for sales, the Sudo Admin must:

### 1. Verify Stock Quantities
- Open Stock Management → Products & Drinks
- Compare the system products with the physical stock sheet
- For each product, click "Record Stock In"
- Enter the actual quantity from the physical count
- Enter the cost price per unit (what you paid for it)
- Optionally update the selling price if it has changed

### 2. Set Cost Prices
- Cost prices are required to calculate profit margins
- Enter what you actually paid per unit (not the selling price)
- This helps track profitability in reports

### 3. Verify Selling Prices
- Check that all selling prices match your current price list
- Update any prices that have changed

### 4. Set Minimum Stock Levels
- For each product, set a minimum stock level
- This triggers "Low Stock" alerts when inventory gets low
- Example: Set Tusker Can minimum to 24 (one crate)

> Without completing these steps, cashiers will not be able to sell drinks because the system will show zero stock.

### Adding Stock For An Existing Product

1. Click stock-in/add stock.
2. Search and select the product.
3. Enter quantity received.
4. Enter cost price per unit.
5. Optionally update the selling price.
6. Save.

After saving:
- Current stock increases.
- Cost price is updated.
- Selling price is updated if entered.
- A stock movement is recorded.

### Adding A New Product

1. Open the add-new-product form.
2. Enter product name.
3. Choose or type a category.
4. Enter selling price.
5. Enter cost price.
6. Enter starting quantity.
7. Set minimum stock level.
8. Save.

### Low Stock

Low stock items appear when current stock is at or below the minimum stock level. Use this to know what needs restocking.

---

## Managing Food Ingredients

Use Stock Management, then choose Food Ingredients.

### Adding Ingredient Stock

Use this when buying ingredients.

1. Select the ingredient.
2. Enter quantity bought.
3. Enter cost per unit if known.
4. Add notes if needed.
5. Save.

The system records this as Stock In.

### Releasing Ingredients To Kitchen

Use this when ingredients are given to the kitchen for cooking or preparation.

1. Select the ingredient.
2. Enter quantity released.
3. Choose or type the reason.
4. Save.

The system records this as Kitchen Release and reduces ingredient stock.

### Ingredient Movement Reports

Open Reports, then go to the Stock tab. The Food Ingredient Movements table shows:
- Ingredient name.
- Stock In or Kitchen Release.
- Quantity.
- Unit.
- Cost for stock-in records.
- Notes.
- Date and time.

> If a movement is not visible, check the report date filter first.

---

## Managing Food Menu

Use Menu.

You can:
- Add food items.
- Edit prices.
- Delete menu items.

Food menu items are what cashiers sell on the POS food side.

---

## Managing Users

Use Users.

Managers can create accounts depending on their role:
- Admins can create cashier accounts.
- Sudo admins can manage all roles.

Each user should have their own account so sales can be traced to the correct cashier.

---

## System Maintenance Mode

The system can be put into maintenance mode to temporarily lock POS sales.

When maintenance mode is on:
- Cashiers and admins cannot complete sales.
- A red alert will appear on the POS screen.
- Stock and menu management still works normally.

> If you see this message, contact technical support to have it disabled.

---

## Important Business Notes

- Always log in with your own account.
- Do not share passwords.
- Record stock as soon as it is received.
- Release ingredients to the kitchen when they leave store stock.
- Check low-stock reports daily.
- Check sales reports daily before closing.
- Back up the database regularly.

---

## Simple Closing Routine

At the end of the day:

1. Open Reports.
2. Select Today.
3. Check total revenue.
4. Check Cash and M-Pesa totals.
5. Check cashier sales.
6. Check stock movements.
7. Note low-stock products and ingredients.
8. Confirm the physical cash/M-Pesa records match the system.

---

## When Something Looks Wrong

### A sale is missing
Check if the cashier completed checkout. Also check the date filter in Sales History.

### Stock looks wrong
Check stock movements in Reports. Confirm whether stock was added, sold, or released to kitchen.

### Ingredient release is missing
Open Reports, choose the correct date range, and check the Stock tab.

### A cashier cannot access a page
That may be normal. Cashiers only access POS and their own sales.

### A user cannot log in
Check that the email and password are correct. If needed, an admin or sudo admin should update the user account.

### System shows "Maintenance Mode"
Contact technical support. This is a system-level lock that requires administrator intervention.
