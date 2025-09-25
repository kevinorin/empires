-- Empires Game Seed Data
-- Execute this AFTER schema.sql and AFTER creating test users
-- This file is for development/testing purposes only

-- Example: Create a test user first (replace with real user ID from Supabase auth)
-- You can get real user IDs after implementing authentication

-- Test Alliance
INSERT INTO alliances (name, tag, description) 
VALUES ('Test Alliance', 'TEST', 'A test alliance for development') 
ON CONFLICT (name) DO NOTHING;

-- Sample game events for testing the event system
INSERT INTO game_events (type, data, execute_at) VALUES 
('resource_production', '{"village_id": null, "resources": {"wood": 100, "clay": 100, "iron": 100, "crop": 100}}', NOW() + INTERVAL '1 hour'),
('daily_bonus', '{"bonus_type": "gold", "amount": 50}', NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- Building type reference data (not stored in DB, just for reference)
/*
Building Types:
1-4: Resource fields (Woodcutter, Clay pit, Iron mine, Cropland)
5-9: Infrastructure (Sawmill, Brickyard, Iron foundry, Grain mill, Bakery)
10-11: Storage (Warehouse, Granary)
12-22: Military buildings (Blacksmith, Armoury, Tournament square, etc.)
23-40: Special buildings (Crannies, Town hall, Residence, etc.)
*/

-- Unit type reference data (not stored in DB, just for reference)
/*
Unit Types:
1-10: Romans (Legionnaire, Praetorian, Imperian, etc.)
11-20: Teutons (Clubswinger, Spearfighter, Axefighter, etc.)
21-30: Gauls (Phalanx, Swordsman, Pathfinder, etc.)
*/