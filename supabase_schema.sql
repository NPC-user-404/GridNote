-- Create the documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own documents" 
  ON documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" 
  ON documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" 
  ON documents FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" 
  ON documents FOR DELETE 
  USING (auth.uid() = user_id);
