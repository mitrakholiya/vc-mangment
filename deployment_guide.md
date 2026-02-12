# Project Deployment Guide ("Living" the Project)

To make your VC Management project live and accessible online, the recommended path is using **Vercel** for the frontend/API and **MongoDB Atlas** for the database.

## Step 1: Prepare your Database (MongoDB Atlas)

Since your project uses MongoDB, you need a live database instance.

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2.  In **Network Access**, allow access from "0.0.0.0/0" (or specifically Vercel's IPs, but 0.0.0.0 is easier for starters).
3.  In **Database Access**, create a user with read/write permissions.
4.  Get your **Connection String** (Standard connection string, not SRV if you had issues with DNS before).
    - It should look like: `mongodb://<username>:<password>@cluster-shard...`

## Step 2: Deploy to Vercel

1.  Push your code to a **GitHub** repository.
2.  Log in to [Vercel](https://vercel.com/) and click **"Add New" > "Project"**.
3.  Import your GitHub repository.
4.  **Important: Configure Environment Variables**
    In the "Environment Variables" section, add the following from your `.env` file:
    - `MONGODB_URL`: Your live Atlas connection string.
    - `JWT_SECRET`: Any strong random string (e.g., `mohanlalapde`).
    - `CRON_SECRET`: Your cron secret (e.g., `vc-management-cron-secret-2024`).
    - `NEXT_PUBLIC_API_URL`: `https://your-app-name.vercel.app/api`.
5.  Click **Deploy**.

## Step 3: Setup Cron Jobs (Critical for Monthly Logic)

In production, you don't want to run scripts manually every month. You have two options:

### Option A: Fully Automated (Recommended)

If you deploy to **Vercel**, you can automate this using their "Cron Jobs" feature:

1.  Create a file named `vercel.json` in your project root with this content:
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/monthly-contributions?secret=YOUR_CRON_SECRET",
          "schedule": "0 0 1 * *"
        }
      ]
    }
    ```
    _(This runs automatically at 12:00 AM on the 1st of every month)._

### Option B: Manual Trigger for Live Project

If you want to manually trigger it for your **live** project (similar to your `npm run cron:test` but for the web), you can run this command from your terminal:

```bash
curl -X POST "https://your-app-name.vercel.app/api/cron/monthly-contributions?secret=YOUR_CRON_SECRET"
```

OR update your `package.json` to have a production test script:
`"cron:prod": "node -e \"fetch('https://your-app-name.vercel.app/api/cron/monthly-contributions?secret=YOUR_CRON_SECRET', {method:'POST'})\""`

---

## Troubleshooting "Implicit Any" (next-pwa)

I have applied a fix to `next-pwa.d.ts` and `next.config.ts` to resolve the TypeScript error you were seeing. This ensures your project will pass the "Build" step on Vercel.

> [!TIP]
> Always keep your `JWT_SECRET` and `MONGODB_URL` private and never commit them to public repositories. Use Vercel's environment variables dashboard for these.
