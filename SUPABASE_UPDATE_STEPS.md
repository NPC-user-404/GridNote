# Supabase Update Steps: Usernames & Profiles

Follow these steps to apply the recent schema changes to your live Supabase project so the new `username` and `profiles` system works properly.

## Step 1: Open the SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your `GridNote` project.
3. Click on the **SQL Editor** icon in the left sidebar (it looks like a little terminal window/code bracket `>_`).
4. Click **New Query**.

## Step 2: Run the Profile & Trigger SQL
Copy and paste the following SQL into the editor, then click **Run** (or press `Ctrl`+`Enter` / `Cmd`+`Enter`).

```sql
-- 1. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT
);

-- 2. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 3. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Step 3: Backfill Existing Users (Optional but Recommended)
If you already have existing users in your database that you created *before* adding this trigger, they won't have a profile. You can manually create a profile for them by running this quick query in the same SQL Editor:

```sql
INSERT INTO public.profiles (id, email, username)
SELECT id, email, split_part(email, '@', 1) as username
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```
*(This simply creates a profile for existing users and uses the first part of their email as a temporary username).*

## Step 4: Turn off Email Confirmation
Just a quick reminder: to make signups instant, ensure email confirmation is off:
1. In the Supabase Dashboard, go to **Authentication** (the lock icon on the left).
2. Go to **Providers** (under Configuration).
3. Click on **Email**.
4. Make sure **Confirm email** is toggled **OFF**, then click **Save**.
