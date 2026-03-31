-- ============================================================
-- NexBook  -  Admin Portal Seed Data (Supplement)
-- Adds Activities, additional Venues/Facilities/Communities
-- to ensure 25-30 records per admin section for pagination
-- testing. Run AFTER SeedData.sql.
-- ============================================================

USE BookingPlatformDb;
GO

-- ============================================================
-- 1. Activities  (25+ records for pagination testing)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Activities WHERE Name = 'Football 5-a-side')
INSERT INTO Activities (TenantId, Name, DurationMinutes) VALUES
(1, 'Football 5-a-side',      60),
(1, 'Football 11-a-side',     90),
(1, 'Basketball (Half Court)',60),
(1, 'Basketball (Full Court)',90),
(1, 'Tennis (Singles)',       60),
(1, 'Tennis (Doubles)',       60),
(1, 'Badminton (Singles)',    60),
(1, 'Badminton (Doubles)',    60),
(1, 'Squash',                 45),
(1, 'Swimming (Leisure)',     60),
(1, 'Swimming (Training)',    90),
(1, 'Aqua Aerobics',          60),
(1, 'Yoga',                   60),
(1, 'Pilates',                60),
(1, 'Zumba',                  60),
(1, 'CrossFit',               60),
(1, 'Gym & Fitness',          60),
(1, 'Cycling Indoor',         45),
(1, 'Futsal',                 60),
(1, 'Volleyball',             60),
(1, 'Beach Volleyball',       60),
(1, 'Cricket Nets',           60),
(1, 'Athletics Track',        60),
(1, 'Table Tennis',           30),
(1, 'Padel Tennis',           90),
(1, 'Karate Training',        60),
(1, 'Boxing Fitness',         60),
(1, 'Dance Fitness',          60),
(1, 'Martial Arts',           90),
(1, 'Kids Swimming Lesson',   45);

PRINT 'Activities inserted: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- ============================================================
-- 2. Additional Communities  (to expand location tree)
-- ============================================================
-- We add communities spread across existing areas
-- Check your Areas table for valid AreaIds first.
-- AreaId values used below match common UAE seeded data.

-- Only insert if we have fewer than 15 communities
IF (SELECT COUNT(*) FROM Communities WHERE TenantId = 1) < 15
BEGIN
    INSERT INTO Communities (AreaId, TenantId, Name, Description) VALUES
    (1,  1, 'JLT Sports Park',          'Jumeirah Lakes Towers sports area'),
    (2,  1, 'Business Bay Waterfront',  'Active waterfront district near Downtown'),
    (5,  1, 'Jumeirah Beach District',  'Beachside recreational community'),
    (12, 1, 'Palm Jumeirah East',       'Luxury island sports community'),
    (26, 1, 'Reem Island Centre',       'Abu Dhabi Island wellness hub'),
    (29, 1, 'Corniche Active Zone',     'Abu Dhabi corniche promenade sports area'),
    (34, 1, 'University City Quarter',  'Sharjah education and sports district');
    PRINT 'Communities inserted: ' + CAST(@@ROWCOUNT AS VARCHAR);
END;

-- ============================================================
-- 3. Additional Venues (to reach ~20+ venues total)
-- ============================================================
IF (SELECT COUNT(*) FROM Venues WHERE TenantId = 1) < 15
BEGIN
    -- Using the new community IDs (they will be auto-assigned)
    -- Adjust CommunityId values based on actual IDs in your DB.
    -- Communities: use SELECT TOP 20 Id, Name FROM Communities ORDER BY Id to check.
    DECLARE @c1 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'JLT Sports Park'   AND TenantId = 1);
    DECLARE @c2 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'Business Bay Waterfront' AND TenantId = 1);
    DECLARE @c3 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'Jumeirah Beach District' AND TenantId = 1);
    DECLARE @c4 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'Palm Jumeirah East' AND TenantId = 1);
    DECLARE @c5 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'Reem Island Centre' AND TenantId = 1);
    DECLARE @c6 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'Corniche Active Zone' AND TenantId = 1);
    DECLARE @c7 INT = (SELECT TOP 1 Id FROM Communities WHERE Name = 'University City Quarter' AND TenantId = 1);

    INSERT INTO Venues (CommunityId, TenantId, Name, Address, ShortDescription, IsActive) VALUES
    (@c1, 1, 'JLT Fitness Hub',        'JLT Cluster N, Dubai',              'Modern gym and courts in JLT',          1),
    (@c1, 1, 'JLT Aquatic Centre',     'JLT Cluster Q, Dubai',              'Heated pools and swim school',          1),
    (@c2, 1, 'Bay Sports Club',        'Business Bay, Dubai',               'City-centre fitness and sport',         1),
    (@c3, 1, 'Jumeirah Beach Sports',  'Jumeirah Beach Road, Dubai',        'Beach sports and outdoor activities',   1),
    (@c4, 1, 'Palm Elite Sports',      'Palm Jumeirah, Dubai',              'Premium island sports complex',         1),
    (@c5, 1, 'Reem Active Centre',     'Reem Island, Abu Dhabi',            'Island wellness and sport hub',         1),
    (@c6, 1, 'Corniche Rec Club',      'Corniche Road, Abu Dhabi',          'Seaside recreation and sport',          1),
    (@c6, 1, 'Abu Dhabi Sports Arena', 'Corniche Area, Abu Dhabi',          'Multi-sport indoor arena',              1),
    (@c7, 1, 'University Sports Park', 'University City, Sharjah',          'Campus sports complex',                 1),
    (@c7, 1, 'Sharjah Sports Zone',    'University District, Sharjah',      'Affordable community sports',           1);
    PRINT 'Venues inserted: ' + CAST(@@ROWCOUNT AS VARCHAR);
END;

-- ============================================================
-- 4. Additional Facilities
-- ============================================================
-- Add 2-3 facilities per new venue so we have 30+ total
DECLARE @vBase INT = (SELECT MAX(Id) - 9 FROM Venues WHERE TenantId = 1);  -- rough new venue start

-- Only add if fewer than 25 facilities
IF (SELECT COUNT(*) FROM Facilities WHERE TenantId = 1) < 25
BEGIN
    -- JLT Fitness Hub
    DECLARE @v1 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'JLT Fitness Hub'      AND TenantId = 1);
    DECLARE @v2 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'JLT Aquatic Centre'   AND TenantId = 1);
    DECLARE @v3 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Bay Sports Club'       AND TenantId = 1);
    DECLARE @v4 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Jumeirah Beach Sports' AND TenantId = 1);
    DECLARE @v5 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Palm Elite Sports'     AND TenantId = 1);
    DECLARE @v6 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Reem Active Centre'    AND TenantId = 1);
    DECLARE @v7 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Corniche Rec Club'     AND TenantId = 1);
    DECLARE @v8 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Abu Dhabi Sports Arena' AND TenantId = 1);
    DECLARE @v9 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'University Sports Park' AND TenantId = 1);
    DECLARE @v10 INT = (SELECT TOP 1 Id FROM Venues WHERE Name = 'Sharjah Sports Zone'  AND TenantId = 1);

    INSERT INTO Facilities (TenantId, VenueId, Name, Location, SlotDurationMinutes, MaxConsecutiveSlots, Capacity, IsActive) VALUES
    -- JLT Fitness Hub
    (1, @v1, 'Main Gym Floor',       'Level 1',      60, 4, 30, 1),
    (1, @v1, 'Spin Studio',          'Level 2',      45, 4, 20, 1),
    (1, @v1, 'Badminton Court',      'Level 3',      60, 3, 4,  1),
    -- JLT Aquatic
    (1, @v2, 'Main Pool',            'Ground Floor', 60, 3, 25, 1),
    (1, @v2, 'Kids Pool',            'Ground Floor', 60, 3, 15, 1),
    -- Bay Sports Club
    (1, @v3, 'Squash Courts',        'Level 1',      45, 4, 2,  1),
    (1, @v3, 'Yoga Studio',          'Level 2',      60, 4, 20, 1),
    -- Jumeirah Beach Sports
    (1, @v4, 'Beach Volleyball Pit', 'Beachside',    60, 3, 8,  1),
    (1, @v4, 'Outdoor Gym',          'Beachside',    60, 4, 20, 1),
    -- Palm Elite Sports
    (1, @v5, 'Tennis Courts',        'Ground',       60, 3, 4,  1),
    (1, @v5, 'Padel Court',          'Ground',       90, 2, 4,  1),
    -- Reem Active
    (1, @v6, 'Multi-Purpose Hall',   'Level 1',      60, 3, 30, 1),
    (1, @v6, 'CrossFit Box',         'Level 2',      60, 3, 15, 1),
    -- Corniche Rec
    (1, @v7, 'Cycling Track',        'Outdoor',      60, 4, 20, 1),
    (1, @v7, 'Football Pitch',       'Ground',       60, 3, 22, 1),
    -- Abu Dhabi Sports Arena
    (1, @v8, 'Indoor Basketball',    'Main Hall',    60, 3, 10, 1),
    (1, @v8, 'Badminton Hall',       'Wing A',       60, 4, 6,  1),
    -- University Sports Park
    (1, @v9, 'Athletics Track',      'Outdoor',      60, 4, 40, 1),
    (1, @v9, 'Football Ground',      'Outdoor',      90, 2, 22, 1),
    -- Sharjah Sports Zone
    (1, @v10, 'Futsal Court',        'Ground Floor', 60, 3, 10, 1),
    (1, @v10, 'Swimming Pool',       'Level 1',      60, 3, 25, 1);

    PRINT 'Facilities inserted: ' + CAST(@@ROWCOUNT AS VARCHAR);
END;

-- ============================================================
-- 5. Additional Bookings (for admin to test pagination)
--    Spread across different users and facilities
-- ============================================================
IF (SELECT COUNT(*) FROM Bookings WHERE TenantId = 1) < 30
BEGIN
    DECLARE @tid2 INT = 1;
    DECLARE @btype2 INT = 0;

    -- Bookings for user 2 and 3 across various facilities
    -- Using existing facility IDs from original seed (95-110)
    INSERT INTO Bookings (TenantId, UserId, FacilityId, BookingType, StartTime, EndTime, ParticipantCount, Status, CreatedAt, UpdatedAt) VALUES
    (@tid2,2,95,  @btype2,'2026-03-05 08:00','2026-03-05 09:00',2,3,'2026-03-04 10:00','2026-03-05 09:30'),
    (@tid2,2,96,  @btype2,'2026-03-08 17:00','2026-03-08 18:00',2,3,'2026-03-07 09:00','2026-03-08 18:30'),
    (@tid2,3,98,  @btype2,'2026-03-11 09:00','2026-03-11 10:00',4,3,'2026-03-10 14:00','2026-03-11 09:30'),
    (@tid2,2,100, @btype2,'2026-03-15 10:00','2026-03-15 11:00',2,2,'2026-03-14 11:00','2026-03-15 08:00'),
    (@tid2,3,103, @btype2,'2026-03-18 14:00','2026-03-18 15:00',6,3,'2026-03-17 10:00','2026-03-18 15:30'),
    (@tid2,2,105, @btype2,'2026-03-20 07:00','2026-03-20 08:00',2,3,'2026-03-19 09:00','2026-03-20 08:30'),
    (@tid2,3,64,  @btype2,'2026-03-22 16:00','2026-03-22 17:00',4,1,'2026-03-21 10:00','2026-03-22 17:30'),
    (@tid2,2,97,  @btype2,'2026-03-25 11:00','2026-03-25 12:00',2,0,'2026-03-24 10:00','2026-03-25 11:00'),
    (@tid2,3,99,  @btype2,'2026-03-27 09:00','2026-03-27 10:00',4,1,'2026-03-26 09:00','2026-03-27 09:00'),
    (@tid2,2,106, @btype2,'2026-04-01 15:00','2026-04-01 16:00',2,1,'2026-03-28 11:00','2026-03-28 11:00'),
    (@tid2,3,108, @btype2,'2026-04-03 08:00','2026-04-03 09:30',4,0,'2026-03-29 09:00','2026-03-29 09:00'),
    (@tid2,2,110, @btype2,'2026-04-05 17:00','2026-04-05 18:00',2,1,'2026-03-30 12:00','2026-03-30 12:00');

    PRINT 'Additional bookings inserted: ' + CAST(@@ROWCOUNT AS VARCHAR);
END;

PRINT 'Admin seed data inserted successfully.';
GO
