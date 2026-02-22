
-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location TEXT NOT NULL,
  message TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Active authenticated users can view messages for any location
CREATE POLICY "Authenticated users can view messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
  ON public.chat_messages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Index for fast location-based queries
CREATE INDEX idx_chat_messages_location_created ON public.chat_messages (location, created_at DESC);
