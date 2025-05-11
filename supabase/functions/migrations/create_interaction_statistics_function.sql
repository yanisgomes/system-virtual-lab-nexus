
-- Create a function to get interaction statistics
CREATE OR REPLACE FUNCTION public.get_interaction_statistics()
RETURNS TABLE(
  id text,
  source_ip text,
  log_type text,
  interaction_count int,
  last_interaction timestamp with time zone
) LANGUAGE sql AS $$
  SELECT 
    gen_random_uuid()::text as id,
    source_ip, 
    log_type, 
    COUNT(*) as interaction_count,
    MAX(timestamp) as last_interaction
  FROM public.router_logs
  GROUP BY source_ip, log_type
  ORDER BY COUNT(*) DESC;
$$;
