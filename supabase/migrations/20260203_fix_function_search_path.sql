-- Fix security warning: function_search_path_mutable
-- Voegt SET search_path = '' toe aan storage tracking functies
-- Dit voorkomt potentiële privilege escalation via search_path manipulatie

-- Vervang increment_storage_used met vaste search_path
CREATE OR REPLACE FUNCTION public.increment_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + bytes
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Vervang decrement_storage_used met vaste search_path
CREATE OR REPLACE FUNCTION public.decrement_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) - bytes)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
