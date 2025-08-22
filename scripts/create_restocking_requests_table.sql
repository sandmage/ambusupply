-- Create restocking_requests table for managing inventory restocking workflows
CREATE TABLE IF NOT EXISTS restocking_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    reason TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')) DEFAULT 'pending',
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    ordered_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restocking_requests_vehicle_id ON restocking_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_restocking_requests_inventory_item_id ON restocking_requests(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_restocking_requests_status ON restocking_requests(status);
CREATE INDEX IF NOT EXISTS idx_restocking_requests_priority ON restocking_requests(priority);
CREATE INDEX IF NOT EXISTS idx_restocking_requests_requested_at ON restocking_requests(requested_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_restocking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_restocking_requests_updated_at
    BEFORE UPDATE ON restocking_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_restocking_requests_updated_at();

-- Enable RLS
ALTER TABLE restocking_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all restocking requests" ON restocking_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can create restocking requests" ON restocking_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update restocking requests" ON restocking_requests
    FOR UPDATE USING (true);

-- Create compliance_alerts table for automated notifications
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    vehicle_inventory_item_id UUID NOT NULL REFERENCES vehicle_inventory_items(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('below_par', 'critical', 'expired', 'expiring_soon')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance_alerts
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_vehicle_id ON compliance_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_inventory_item_id ON compliance_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_alert_type ON compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_is_acknowledged ON compliance_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created_at ON compliance_alerts(created_at);

-- Create updated_at trigger for compliance_alerts
CREATE TRIGGER trigger_update_compliance_alerts_updated_at
    BEFORE UPDATE ON compliance_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_restocking_requests_updated_at();

-- Enable RLS for compliance_alerts
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_alerts
CREATE POLICY "Users can view all compliance alerts" ON compliance_alerts
    FOR SELECT USING (true);

CREATE POLICY "Users can create compliance alerts" ON compliance_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update compliance alerts" ON compliance_alerts
    FOR UPDATE USING (true);

-- Create function to automatically generate compliance alerts
CREATE OR REPLACE FUNCTION generate_compliance_alerts()
RETURNS void AS $$
DECLARE
    item_record RECORD;
    alert_message TEXT;
    alert_type TEXT;
    alert_severity TEXT;
    days_until_expiration INTEGER;
BEGIN
    -- Clear existing unacknowledged alerts to regenerate them
    DELETE FROM compliance_alerts WHERE is_acknowledged = FALSE;
    
    -- Loop through all vehicle inventory items to check compliance
    FOR item_record IN
        SELECT 
            vi.*,
            v.vehicle_number,
            ii.name as item_name,
            ii.unit_of_measure,
            su.name as storage_unit_name,
            sl.name as storage_location_name
        FROM vehicle_inventory_items vi
        JOIN vehicles v ON vi.vehicle_id = v.id
        JOIN inventory_items ii ON vi.inventory_item_id = ii.id
        LEFT JOIN vehicle_storage_units su ON vi.storage_unit_id = su.id
        LEFT JOIN vehicle_storage_locations sl ON vi.storage_location_id = sl.id
        WHERE v.status = 'active'
    LOOP
        -- Check for critical (zero quantity)
        IF item_record.current_quantity = 0 THEN
            alert_type := 'critical';
            alert_severity := 'critical';
            alert_message := format('CRITICAL: %s is out of stock in %s (%s)',
                item_record.item_name,
                item_record.vehicle_number,
                COALESCE(item_record.storage_unit_name, 'Unknown location')
            );
            
            INSERT INTO compliance_alerts (
                vehicle_id, inventory_item_id, vehicle_inventory_item_id,
                alert_type, severity, message
            ) VALUES (
                item_record.vehicle_id, item_record.inventory_item_id, item_record.id,
                alert_type, alert_severity, alert_message
            );
            
        -- Check for below par level
        ELSIF item_record.current_quantity < item_record.par_level_min THEN
            alert_type := 'below_par';
            alert_severity := 'high';
            alert_message := format('Below Par: %s has %s %s (min: %s) in %s (%s)',
                item_record.item_name,
                item_record.current_quantity,
                item_record.unit_of_measure,
                item_record.par_level_min,
                item_record.vehicle_number,
                COALESCE(item_record.storage_unit_name, 'Unknown location')
            );
            
            INSERT INTO compliance_alerts (
                vehicle_id, inventory_item_id, vehicle_inventory_item_id,
                alert_type, severity, message
            ) VALUES (
                item_record.vehicle_id, item_record.inventory_item_id, item_record.id,
                alert_type, alert_severity, alert_message
            );
        END IF;
        
        -- Check for expiration
        IF item_record.expiration_date IS NOT NULL THEN
            days_until_expiration := (item_record.expiration_date::date - CURRENT_DATE);
            
            IF days_until_expiration <= 0 THEN
                alert_type := 'expired';
                alert_severity := 'critical';
                alert_message := format('EXPIRED: %s expired on %s in %s (%s)',
                    item_record.item_name,
                    item_record.expiration_date::date,
                    item_record.vehicle_number,
                    COALESCE(item_record.storage_unit_name, 'Unknown location')
                );
                
                INSERT INTO compliance_alerts (
                    vehicle_id, inventory_item_id, vehicle_inventory_item_id,
                    alert_type, severity, message
                ) VALUES (
                    item_record.vehicle_id, item_record.inventory_item_id, item_record.id,
                    alert_type, alert_severity, alert_message
                );
                
            ELSIF days_until_expiration <= 30 THEN
                alert_type := 'expiring_soon';
                alert_severity := CASE 
                    WHEN days_until_expiration <= 7 THEN 'high'
                    WHEN days_until_expiration <= 14 THEN 'medium'
                    ELSE 'low'
                END;
                alert_message := format('Expiring Soon: %s expires in %s days (%s) in %s (%s)',
                    item_record.item_name,
                    days_until_expiration,
                    item_record.expiration_date::date,
                    item_record.vehicle_number,
                    COALESCE(item_record.storage_unit_name, 'Unknown location')
                );
                
                INSERT INTO compliance_alerts (
                    vehicle_id, inventory_item_id, vehicle_inventory_item_id,
                    alert_type, severity, message
                ) VALUES (
                    item_record.vehicle_id, item_record.inventory_item_id, item_record.id,
                    alert_type, alert_severity, alert_message
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to run compliance checks automatically
CREATE OR REPLACE FUNCTION schedule_compliance_check()
RETURNS void AS $$
BEGIN
    PERFORM generate_compliance_alerts();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE restocking_requests IS 'Manages inventory restocking requests and workflows';
COMMENT ON TABLE compliance_alerts IS 'Stores automated compliance alerts for inventory monitoring';
COMMENT ON FUNCTION generate_compliance_alerts() IS 'Generates compliance alerts based on current inventory status';
