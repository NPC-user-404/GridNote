# Deploying GridNote to Vercel via GitHub

Follow these steps to host your GridNote application on Vercel for free.

## 1. Push Your Code to GitHub
Before deploying, your code needs to be in a GitHub repository.
1. Go to [GitHub](https://github.com/) and log in or create an account.
2. Create a **New Repository**. Give it a name (e.g., `gridnote-app`) and leave it as Public or Private. Do **not** initialize it with a README, .gitignore, or license.
3. Open a terminal in your local project folder and run the following commands to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

## 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com/) and sign up or log in using your **GitHub account**.
2. From your Vercel dashboard, click **Add New** > **Project**.
3. In the "Import Git Repository" section, find the repository you just created (`gridnote-app`) and click **Import**.

## 3. Configure Your Project
Vercel will automatically detect that this is a Vite/React project and set the correct build commands (`npm run build`) and output directory (`dist`).

**Important: Add Environment Variables**
Because your `.env` file is ignored by Git (for security reasons), you must provide your Supabase keys directly to Vercel.
1. Expand the **Environment Variables** section.
2. Add your Supabase URL:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co`
   - Click **Add**.
3. Add your Supabase Anon Key:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR...`
   - Click **Add**.

## 4. Deploy!
1. Click the **Deploy** button.
2. Vercel will now build your project. This usually takes about 1-2 minutes.
3. Once finished, you will see a success screen with a preview of your app. 
4. Click **Continue to Dashboard** and click the **Visit** button to see your live, hosted GridNote application!

## Optional: Custom Domains
If you want a custom domain name instead of a `.vercel.app` link, you can add one by going to your project in Vercel, clicking **Settings**, then **Domains**, and following the instructions to add and configure your domain.
