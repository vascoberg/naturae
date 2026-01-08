-- Functies voor het bijwerken van tag usage_count

-- Increment usage_count
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE tags
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = tag_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement usage_count
CREATE OR REPLACE FUNCTION decrement_tag_usage(tag_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE tags
  SET usage_count = GREATEST(COALESCE(usage_count, 0) - 1, 0)
  WHERE id = tag_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_tag_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_tag_usage(UUID) TO authenticated;
