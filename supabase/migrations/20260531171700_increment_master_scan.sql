CREATE OR REPLACE FUNCTION increment_master_scan(event_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE events SET master_scan_count = COALESCE(master_scan_count, 0) + 1 WHERE id = event_uuid;
END;
$$ LANGUAGE plpgsql;
