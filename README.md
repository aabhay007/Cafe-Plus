# Cafe Plus — Daily Register & Sales Management Web App

A modern, responsive web application built for **Cafe Plus** to digitize daily stock registers, revenue reconciliation, and kitchen expenses. Designed for **Vercel** serverless deployment with **Turso Cloud Database (LibSQL)**.

---

## 🔐 Staff Sign In Credentials

- **Username**: `Shubham`
- **Password**: `shubham@cafeplus`

*(Authorized staff access only. No signup enabled.)*

---

## 🚀 How to Deploy to Vercel (Step-by-Step)

### Step 1: Get Your Turso Auth Token
Your Turso database URL is:
`libsql://cafe-plus-abhay007.aws-eu-west-1.turso.io`

You need an authentication token to allow Vercel to connect to it. In your terminal or Turso dashboard:
```bash
turso db tokens create cafe-plus-abhay007
```
*(Copy the generated token string)*

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Complete Cafe Plus Vercel + Turso App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cafe-plus.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com)** and click **"Add New Project"**.
2. Select your `cafe-plus` GitHub repository.
3. In **Environment Variables**, add:
   - `TURSO_DATABASE_URL`: `libsql://cafe-plus-abhay007.aws-eu-west-1.turso.io`
   - `TURSO_AUTH_TOKEN`: *(Paste your Turso auth token from Step 1)*
4. Click **Deploy**!

Vercel will build the frontend, deploy the `/api` serverless backend, and connect to your Turso database. All tables and initial sample data (`30/04/26`) will automatically seed on first load!

---

## 💻 Running Locally

### Option A: Quick 1-Click Launch (Windows)
Double-click `start.bat` in the project folder, or run:
```bash
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

*(If you don't provide a `TURSO_AUTH_TOKEN` locally, it will automatically use local SQLite storage).*

---

## 🧪 Automated Test Suite
To run the automated end-to-end tests:
```bash
node test_all.js
```
Runs 20 automated integration tests covering Auth, Category CRUD, Items, Stock calculation, EOD Settlement, Purchases, Rollover, and CSV Exports.
