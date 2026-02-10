# Deployment Guide: How to Make Your Application Live

Since your application is built with **Next.js** and **MongoDB**, the easiest and most reliable way to deploy it is using **Vercel** (the creators of Next.js).

## Prerequisite: Check Your Build

Before deploying, run this command locally to make sure there are no errors:

```bash
npm run build
```

If you see any errors (TypeScript or ESLint), fix them first.

## Step 1: Push Code to GitHub

1. Create a repository on [GitHub](https://github.com/).
2. Push your project code to this repository.
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git branch -M main
   # Replace with your repo URL
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## Step 2: Deploy on Vercel

1. Go to [Vercel.com](https://vercel.com/) and sign up/login with GitHub.
2. Click **"Add New"** -> **"Project"**.
3. Select the GitHub repository you just created and click **"Import"**.

## Step 3: Configure Environment Variables

In the "Configure Project" screen on Vercel:

1. Scroll down to **"Environment Variables"**.
2. Add the variables from your local `.env` file one by one:

   | Key           | Value                                                                                                                                                                                                                                        |
   | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `MONGODB_URL` | `mongodb://meetrakholiya31_db_user:YvstIt9j7B4YRTAU@ac-ukqvh0p-shard-00-00.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-01.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-02.jocbtwe.mongodb.net:27017/VCmangment?ssl=true&authSource=admin` |
   | `JWT_SECRET`  | `mohanlalapde` (or generate a stronger one)                                                                                                                                                                                                  |
   | `CRON_SECRET` | `vc-management-cron-secret-2024`                                                                                                                                                                                                             |

3. Click **"Deploy"**.

## Step 4: Add Domain (Optional)

Once deployed, Vercel gives you a free URL (e.g., `vc-management.vercel.app`).

- To add your own domain (e.g., `myvcapp.com`), go to **Settings > Domains** in the Vercel dashboard.

---

## Important Security Checks

Before going live, you should delete the temporary seed API files we created, or anyone who guesses the URL could reset your database!
**Delete these files:**

- `src/app/api/seed-users/route.ts`
- `src/app/api/seed-venture/route.ts`
- `src/app/api/seed-venture-approved/route.ts`
- `src/app/api/update-status/route.ts`
