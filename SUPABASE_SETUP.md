# Connecting GridNote to Supabase

Follow these steps to connect your local GridNote application to your Supabase project.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in or create an account.
2. Click **New Project** and select your organization.
3. Enter a name and strong database password, then click **Create new project**.
4. Wait a minute or two for your database to finish provisioning.

## 2. Get Your API Keys
1. In your Supabase project dashboard, navigate to **Project Settings** (the gear icon on the left sidebar).
2. Go to the **API** section.
3. Locate your **Project URL** and your **anon / public key**.

## 3. Update Environment Variables
1. Open the `.env` file in the root of your GridNote project.
2. Replace the placeholder values with the URL and Anon Key from your Supabase dashboard:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
   ```
3. Restart your local development server if it is currently running (`Ctrl+C` then `npm run dev`).

## 4. Setup the Database Schema
To ensure your notes are saved securely, you need to create the `documents` table and set up Row Level Security (RLS) policies.
1. Open the **SQL Editor** in your Supabase dashboard (the `<>` icon on the left sidebar).
2. Click **New query**.
3. Copy the entire contents of the `supabase_schema.sql` file located in the root of your GridNote project.
4. Paste it into the Supabase SQL Editor and click **Run**.

## 5. Enable Authentication
1. Go to **Authentication** > **Providers** in your Supabase dashboard.
2. Ensure **Email** is enabled. 
3. (Optional) If you want users to be able to sign up immediately without clicking a confirmation link sent to their email, go to **Authentication** > **Providers** > **Email** and toggle off **Confirm email**.

## You're all set!
Your GridNote application is now fully connected to Supabase. You can open your app, click **Login**, and create a new account to test the synchronization.
