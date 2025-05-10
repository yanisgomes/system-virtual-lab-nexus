
-- Function to increment the interaction count for a specific IP and log type
CREATE OR REPLACE FUNCTION increment_interaction_count(ip TEXT, log_t TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE interaction_statistics 
  SET 
    interaction_count = interaction_count + 1,
    last_interaction = NOW()
  WHERE 
    source_ip = ip AND 
    log_type = log_t;
END;
$$;
