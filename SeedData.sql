-- ============================================================
-- NexBook  –  Demo Seed Data
-- Adds communities, venues, facilities and 30 bookings for
-- user Alice Johnson (UserId=1, TenantId=1)
-- ============================================================

-- ── 1. Communities  (new, across UAE cities/areas) ────────────
INSERT INTO Communities (AreaId, TenantId, Name, Description) VALUES
  (1,  1, 'JVC Park Residences',          'Jumeirah Village Circle – lush park community'),
  (5,  1, 'Dubai Marina Walk',             'Vibrant waterfront lifestyle district'),
  (12, 1, 'Dubai Hills Grove',             'Premium golf and sports community'),
  (26, 1, 'Yas Island Sports Hub',         'World-class sports and entertainment'),
  (27, 1, 'Saadiyat Cultural Quarter',     'Arts, culture and outdoor sports'),
  (29, 1, 'Al Khalidiyah Sports District', 'Central Abu Dhabi sports precinct'),
  (34, 1, 'Al Majaz Waterfront',           'Sharjah waterfront leisure district');
-- New community IDs: 2–8  (auto-increment after existing id=1)

-- ── 2. Venues ─────────────────────────────────────────────────
INSERT INTO Venues (CommunityId, TenantId, Name, Address, ShortDescription, IsActive) VALUES
  (2, 1, 'JVC Sports Club',          'JVC District 12, Dubai',              'Multi-sport facility in JVC',           1),
  (3, 1, 'Marina Active Centre',     'Marina Walk, Dubai',                  'Fitness & courts on the waterfront',    1),
  (4, 1, 'Dubai Hills Arena',        'Dubai Hills Estate, Dubai',           'Premium sports arena',                  1),
  (5, 1, 'Yas Arena Fitness',        'Yas Island, Abu Dhabi',               'Olympic-grade sports complex',          1),
  (6, 1, 'Saadiyat Sports Complex',  'Saadiyat Island, Abu Dhabi',          'Beachside sports & wellness',           1),
  (7, 1, 'Al Khalidiyah Club',       'Al Khalidiyah, Abu Dhabi',            'Community sports & recreation',         1),
  (8, 1, 'Al Majaz Sports Centre',   'Al Majaz, Sharjah',                   'Waterfront sports facility',            1);
-- New venue IDs: 2–8

-- ── 3. Facilities ─────────────────────────────────────────────
INSERT INTO Facilities (TenantId, VenueId, Name, Location, SlotDurationMinutes, MaxConsecutiveSlots, Capacity, IsActive) VALUES
  -- JVC Sports Club (VenueId=2)
  (1, 2, 'Football Field',      'Ground Floor',  60, 3, 22, 1),
  (1, 2, 'Tennis Court A',      'Level 1',       60, 3, 4,  1),
  (1, 2, 'Badminton Hall',      'Level 2',       60, 4, 6,  1),
  -- Marina Active Centre (VenueId=3)
  (1, 3, 'Olympic Pool',        'Ground Floor',  60, 3, 30, 1),
  (1, 3, 'Squash Court',        'Level 1',       60, 3, 2,  1),
  (1, 3, 'Gym & Fitness',       'Level 2',       60, 4, 20, 1),
  -- Dubai Hills Arena (VenueId=4)
  (1, 4, 'Basketball Court',    'Ground Floor',  60, 3, 10, 1),
  (1, 4, 'Cricket Ground',      'Outdoor',       120,2, 22, 1),
  -- Yas Arena Fitness (VenueId=5)
  (1, 5, 'Athletics Track',     'Outdoor',       60, 4, 40, 1),
  (1, 5, 'Indoor Arena',        'Main Hall',     90, 2, 50, 1),
  -- Saadiyat Sports Complex (VenueId=6)
  (1, 6, 'Beach Volleyball',    'Beachside',     60, 3, 8,  1),
  (1, 6, 'Yoga Pavilion',       'Garden Level',  60, 4, 20, 1),
  -- Al Khalidiyah Club (VenueId=7)
  (1, 7, 'Football Pitch',      'Ground Floor',  60, 3, 22, 1),
  (1, 7, 'Swimming Pool',       'Level 1',       60, 3, 25, 1),
  -- Al Majaz Sports Centre (VenueId=8)
  (1, 8, 'Futsal Court',        'Ground Floor',  60, 3, 10, 1),
  (1, 8, 'Table Tennis Hall',   'Level 1',       60, 4, 8,  1);
-- New facility IDs: 95–110  (after existing max=94)

-- ── 4. Bookings  (UserId=1, TenantId=1) ───────────────────────
-- Status: 0=Pending, 1=Confirmed, 2=Cancelled, 3=Completed
-- BookingType: 0=Single

DECLARE @uid   INT = 1;
DECLARE @tid   INT = 1;
DECLARE @btype INT = 0;  -- Single

-- Past bookings (Completed / Cancelled) — last ~30 days
INSERT INTO Bookings (TenantId, UserId, FacilityId, BookingType, StartTime, EndTime, ParticipantCount, Status, CreatedAt, UpdatedAt)
VALUES
(@tid,@uid,95,  @btype, '2026-03-01 09:00','2026-03-01 10:00', 1, 3, '2026-02-28 10:00','2026-03-01 10:30'),
(@tid,@uid,96,  @btype, '2026-03-03 17:00','2026-03-03 18:00', 1, 3, '2026-03-02 09:00','2026-03-03 18:30'),
(@tid,@uid,98,  @btype, '2026-03-05 08:00','2026-03-05 09:00', 1, 3, '2026-03-04 14:00','2026-03-05 09:30'),
(@tid,@uid,100, @btype, '2026-03-07 10:00','2026-03-07 11:00', 1, 2, '2026-03-06 11:00','2026-03-07 08:00'),
(@tid,@uid,103, @btype, '2026-03-10 14:00','2026-03-10 15:00', 1, 3, '2026-03-09 10:00','2026-03-10 15:30'),
(@tid,@uid,105, @btype, '2026-03-12 07:00','2026-03-12 08:00', 1, 3, '2026-03-11 09:00','2026-03-12 08:30'),
(@tid,@uid,64,  @btype, '2026-03-14 16:00','2026-03-14 17:00', 1, 3, '2026-03-13 10:00','2026-03-14 17:30'),
(@tid,@uid,97,  @btype, '2026-03-16 11:00','2026-03-16 12:00', 1, 2, '2026-03-15 10:00','2026-03-16 08:00'),
(@tid,@uid,99,  @btype, '2026-03-18 09:00','2026-03-18 10:00', 1, 3, '2026-03-17 09:00','2026-03-18 10:30'),
(@tid,@uid,106, @btype, '2026-03-20 15:00','2026-03-20 16:00', 1, 3, '2026-03-19 11:00','2026-03-20 16:30'),
(@tid,@uid,108, @btype, '2026-03-22 08:00','2026-03-22 09:30', 1, 3, '2026-03-21 09:00','2026-03-22 10:00'),
(@tid,@uid,110, @btype, '2026-03-24 17:00','2026-03-24 18:00', 1, 2, '2026-03-23 12:00','2026-03-24 08:00'),
(@tid,@uid,95,  @btype, '2026-03-26 10:00','2026-03-26 11:00', 1, 3, '2026-03-25 10:00','2026-03-26 11:30'),
(@tid,@uid,101, @btype, '2026-03-28 09:00','2026-03-28 10:00', 1, 3, '2026-03-27 09:00','2026-03-28 10:30'),

-- Current / near-future bookings (Confirmed / Pending) — next ~30 days
(@tid,@uid,64,  @btype, '2026-04-01 07:00','2026-04-01 08:00', 1, 1, '2026-03-30 09:00','2026-03-30 09:00'),
(@tid,@uid,96,  @btype, '2026-04-02 16:00','2026-04-02 17:00', 1, 1, '2026-03-30 10:00','2026-03-30 10:00'),
(@tid,@uid,98,  @btype, '2026-04-04 09:00','2026-04-04 10:00', 1, 1, '2026-03-31 09:00','2026-03-31 09:00'),
(@tid,@uid,103, @btype, '2026-04-06 14:00','2026-04-06 15:00', 1, 0, '2026-04-01 09:00','2026-04-01 09:00'),
(@tid,@uid,105, @btype, '2026-04-08 07:00','2026-04-08 08:00', 1, 1, '2026-04-01 10:00','2026-04-01 10:00'),
(@tid,@uid,107, @btype, '2026-04-10 10:00','2026-04-10 12:00', 1, 1, '2026-04-02 09:00','2026-04-02 09:00'),
(@tid,@uid,64,  @btype, '2026-04-12 16:00','2026-04-12 17:00', 1, 1, '2026-04-02 10:00','2026-04-02 10:00'),
(@tid,@uid,99,  @btype, '2026-04-14 08:00','2026-04-14 09:00', 1, 0, '2026-04-03 09:00','2026-04-03 09:00'),
(@tid,@uid,109, @btype, '2026-04-16 11:00','2026-04-16 12:00', 1, 1, '2026-04-03 10:00','2026-04-03 10:00'),
(@tid,@uid,64,  @btype, '2026-04-18 13:00','2026-04-18 14:00', 1, 1, '2026-04-04 09:00','2026-04-04 09:00'),
(@tid,@uid,95,  @btype, '2026-04-20 09:00','2026-04-20 10:00', 1, 0, '2026-04-04 10:00','2026-04-04 10:00'),
(@tid,@uid,100, @btype, '2026-04-22 16:00','2026-04-22 17:00', 1, 1, '2026-04-05 09:00','2026-04-05 09:00'),
(@tid,@uid,106, @btype, '2026-04-24 07:00','2026-04-24 08:00', 1, 1, '2026-04-05 10:00','2026-04-05 10:00'),
(@tid,@uid,64,  @btype, '2026-04-26 14:00','2026-04-26 15:00', 1, 0, '2026-04-06 09:00','2026-04-06 09:00');

-- ── 5. FacilityReservations (one per booking, matching times) ─
-- We insert one reservation row per booking.
-- Get the IDs of the newly inserted bookings using a range approach.
-- The existing max booking ID was 10, so new bookings are IDs 11–38.

INSERT INTO FacilityReservations (BookingId, FacilityId, ReservationDate, StartTime, EndTime, Status)
SELECT b.Id, b.FacilityId, CAST(b.StartTime AS DATE), b.StartTime, b.EndTime, b.Status
FROM   Bookings b
WHERE  b.Id >= 11
  AND  b.UserId = 1
  AND  b.TenantId = 1
  AND  NOT EXISTS (
    SELECT 1 FROM FacilityReservations fr WHERE fr.BookingId = b.Id
  );

PRINT 'Seed data inserted successfully.';
GO
