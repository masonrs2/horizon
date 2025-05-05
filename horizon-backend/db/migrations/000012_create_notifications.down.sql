-- Drop notifications table and related objects
DROP TRIGGER IF EXISTS set_timestamp ON notifications;
DROP FUNCTION IF EXISTS trigger_set_timestamp();
DROP TABLE IF EXISTS notifications;
DROP TYPE IF EXISTS notification_type; 