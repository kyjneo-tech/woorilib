-- Fix permissions for RPC functions
-- Granting explicit usage on schema and execute on functions

-- 1. Ensure usage on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_peer_popular_books(INTEGER, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_peer_comparison(UUID, INTEGER, INTEGER) TO postgres, anon, authenticated, service_role;

-- 3. Set search_path for security and reliability (best practice for SECURITY DEFINER)
ALTER FUNCTION get_peer_popular_books(INTEGER, INTEGER, INTEGER) SET search_path = public, extensions;
ALTER FUNCTION get_peer_comparison(UUID, INTEGER, INTEGER) SET search_path = public, extensions;
