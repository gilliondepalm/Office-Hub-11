-- Add rejection_reason column to absences table
-- Stores the optional reason given by a manager/admin when rejecting an absence request
ALTER TABLE absences ADD COLUMN IF NOT EXISTS rejection_reason text;
