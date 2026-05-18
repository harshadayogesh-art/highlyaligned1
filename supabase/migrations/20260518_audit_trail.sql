-- ============================================
-- Audit Trail & Order Status History
-- Selfaligned — Industry Standard Compliance
-- ============================================

-- 1. Audit Logs Table
-- Tracks WHO changed WHAT and WHEN across all admin operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Row Level Security for audit_logs (only admins can read)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs viewable by admins only"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor', 'support')
    )
  );

CREATE POLICY "Audit logs insertable by service role"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- 2. Order Status History Table
-- Tracks every status change with WHO made it
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  previous_status text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name text,
  notes text,
  extra jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Row Level Security
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order status history viewable by admins and the customer"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor', 'support')
    )
    OR
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Order status history insertable by service role"
  ON order_status_history FOR INSERT
  WITH CHECK (true);

-- 3. Soft Delete Columns
-- Add deleted_at to key tables for recoverable deletes
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE page_blocks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 4. Helper Function: Log Audit Entry
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id uuid,
  p_user_email text,
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, user_email, action, table_name, record_id,
    old_data, new_data, ip_address
  ) VALUES (
    p_user_id, p_user_email, p_action, p_table_name, p_record_id,
    p_old_data, p_new_data, p_ip_address
  );
END;
$$;

-- 5. Helper Function: Log Order Status Change
CREATE OR REPLACE FUNCTION log_order_status(
  p_order_id uuid,
  p_status text,
  p_previous_status text,
  p_changed_by uuid,
  p_changed_by_name text,
  p_notes text DEFAULT NULL,
  p_extra jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO order_status_history (
    order_id, status, previous_status, changed_by, changed_by_name, notes, extra
  ) VALUES (
    p_order_id, p_status, p_previous_status, p_changed_by, p_changed_by_name, p_notes, p_extra
  );
END;
$$;
