-- ============================================================
-- SeedComplaints.sql
-- Seeds 5 complaint categories + 25 test complaints for user 1
-- Run against: BookingPlatformDb
-- ============================================================

USE BookingPlatformDb;
GO

-- ── 1. Complaint Categories ──────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM ComplaintCategories WHERE TenantId = 1)
BEGIN
  INSERT INTO ComplaintCategories (TenantId, Name, IsActive, SortOrder)
  VALUES
    (1, 'Facility',  1, 1),
    (1, 'Booking',   1, 2),
    (1, 'Technical', 1, 3),
    (1, 'General',   1, 4),
    (1, 'Others',    1, 5);
END
GO

-- Grab category IDs
DECLARE @CatFacility  INT = (SELECT Id FROM ComplaintCategories WHERE TenantId=1 AND Name='Facility');
DECLARE @CatBooking   INT = (SELECT Id FROM ComplaintCategories WHERE TenantId=1 AND Name='Booking');
DECLARE @CatTech      INT = (SELECT Id FROM ComplaintCategories WHERE TenantId=1 AND Name='Technical');
DECLARE @CatGeneral   INT = (SELECT Id FROM ComplaintCategories WHERE TenantId=1 AND Name='General');
DECLARE @CatOthers    INT = (SELECT Id FROM ComplaintCategories WHERE TenantId=1 AND Name='Others');

-- ── 2. Insert 25 Complaints for UserId=1, TenantId=1 ────────
INSERT INTO Complaints
  (UserId, TenantId, Title, Description, Status, CategoryId, Category, BookingId, CreatedAt, UpdatedAt)
VALUES
  -- Facility complaints
  (1,1,'Pool temperature too cold','The swimming pool water temperature was uncomfortably cold during my session. Needs to be checked and adjusted.',0 /*Open*/,  @CatFacility,'Facility', NULL,         DATEADD(DAY,-30,GETDATE()), DATEADD(DAY,-30,GETDATE())),
  (1,1,'Changing room lockers broken','Multiple lockers in the mens changing room were broken and could not be locked.',                              1 /*InProgress*/, @CatFacility,'Facility', NULL, DATEADD(DAY,-28,GETDATE()), DATEADD(DAY,-27,GETDATE())),
  (1,1,'Basketball court lights flickering','The overhead lights on the main basketball court keep flickering during evening sessions.',              2 /*Resolved*/,   @CatFacility,'Facility', NULL, DATEADD(DAY,-25,GETDATE()), DATEADD(DAY,-20,GETDATE())),
  (1,1,'Tennis court net damaged','The net on court 2 is torn and sagging. Makes fair play impossible.',                                             0 /*Open*/,       @CatFacility,'Facility', NULL, DATEADD(DAY,-22,GETDATE()), DATEADD(DAY,-22,GETDATE())),
  (1,1,'Gym equipment out of order','The treadmill in row 3 (machines 4 and 5) have been out of order for over a week with no notice.',              1 /*InProgress*/, @CatFacility,'Facility', NULL, DATEADD(DAY,-18,GETDATE()), DATEADD(DAY,-17,GETDATE())),

  -- Booking complaints
  (1,1,'Booking cancelled without notice','My confirmed booking for the squash court was cancelled 30 mins before without any email or SMS notification.',4 /*Cancelled*/, @CatBooking,'Booking', 2, DATEADD(DAY,-26,GETDATE()), DATEADD(DAY,-25,GETDATE())),
  (1,1,'Double charged for single booking','My bank statement shows I was charged twice for booking #3. Please refund the duplicate charge.',          1 /*InProgress*/, @CatBooking,'Booking', 3, DATEADD(DAY,-24,GETDATE()), DATEADD(DAY,-23,GETDATE())),
  (1,1,'Unable to cancel booking online','The cancel button on My Bookings page gives an error. I could not cancel in time and was still charged.',   2 /*Resolved*/,   @CatBooking,'Booking', 4, DATEADD(DAY,-20,GETDATE()), DATEADD(DAY,-15,GETDATE())),
  (1,1,'Booking confirmation email not received','I completed the booking and payment but never received a confirmation email. Booking #5.',           0 /*Open*/,       @CatBooking,'Booking', 5, DATEADD(DAY,-16,GETDATE()), DATEADD(DAY,-16,GETDATE())),
  (1,1,'Wrong facility assigned to booking','I booked Court A but was assigned Court B which is smaller and was already occupied by another group.',   5 /*Closed*/,     @CatBooking,'Booking', 7, DATEADD(DAY,-14,GETDATE()), DATEADD(DAY,-10,GETDATE())),

  -- Technical complaints
  (1,1,'App crashes on booking confirmation','Every time I reach the booking confirmation step the app crashes and I lose my selection.',              1 /*InProgress*/, @CatTech,'Technical', NULL, DATEADD(DAY,-21,GETDATE()), DATEADD(DAY,-20,GETDATE())),
  (1,1,'Cannot upload profile photo','The profile photo upload button does nothing when I click it on both mobile and desktop.',                       0 /*Open*/,       @CatTech,'Technical', NULL, DATEADD(DAY,-19,GETDATE()), DATEADD(DAY,-19,GETDATE())),
  (1,1,'Search filters not saving','When I select country and city filters, they reset when I navigate away and come back.',                           2 /*Resolved*/,   @CatTech,'Technical', NULL, DATEADD(DAY,-17,GETDATE()), DATEADD(DAY,-12,GETDATE())),
  (1,1,'Notification bell not working','I have unread notifications but the bell icon shows 0 and clicking it shows an empty list.',                  6 /*ActionRequired*/, @CatTech,'Technical', NULL, DATEADD(DAY,-13,GETDATE()), DATEADD(DAY,-11,GETDATE())),
  (1,1,'Password reset email goes to spam','The password reset link always ends up in spam folder and expires before I can use it.',                  1 /*InProgress*/, @CatTech,'Technical', NULL, DATEADD(DAY,-10,GETDATE()), DATEADD(DAY,-9,GETDATE())),

  -- General complaints
  (1,1,'Staff behaviour at reception','The receptionist was rude and dismissive when I asked about available time slots.',                             0 /*Open*/,       @CatGeneral,'General', NULL, DATEADD(DAY,-29,GETDATE()), DATEADD(DAY,-29,GETDATE())),
  (1,1,'Parking area not maintained','The parking area outside the venue is poorly lit and has several potholes. Safety hazard at night.',             2 /*Resolved*/,   @CatGeneral,'General', NULL, DATEADD(DAY,-23,GETDATE()), DATEADD(DAY,-18,GETDATE())),
  (1,1,'No drinking water available','During a 2-hour badminton session there was no drinking water station available on the floor.',                  1 /*InProgress*/, @CatGeneral,'General', NULL, DATEADD(DAY,-15,GETDATE()), DATEADD(DAY,-14,GETDATE())),
  (1,1,'Washrooms need urgent attention','The washrooms near the squash courts were not cleaned and lacked soap and paper towels.',                    7 /*MoreInfoRequired*/, @CatGeneral,'General', NULL, DATEADD(DAY,-11,GETDATE()), DATEADD(DAY,-10,GETDATE())),
  (1,1,'First aid kit missing from gym','There is no first aid kit visible anywhere in the gym area. This seems like a safety compliance issue.',      0 /*Open*/,       @CatGeneral,'General', NULL, DATEADD(DAY,-8,GETDATE()),  DATEADD(DAY,-8,GETDATE())),

  -- Others
  (1,1,'Request for longer opening hours','Could the facility extend opening hours to 10pm on weekdays? Many members finish work late.',               2 /*Resolved*/,   @CatOthers,'Others', NULL, DATEADD(DAY,-27,GETDATE()), DATEADD(DAY,-21,GETDATE())),
  (1,1,'Suggestion: add yoga class schedule','Please consider adding a weekly yoga class. Multiple members have requested this.',                      5 /*Closed*/,     @CatOthers,'Others', NULL, DATEADD(DAY,-20,GETDATE()), DATEADD(DAY,-16,GETDATE())),
  (1,1,'Membership card not working at gate','My membership card was denied at the entrance gate twice this week. Very inconvenient.',                 1 /*InProgress*/, @CatOthers,'Others', NULL, DATEADD(DAY,-9,GETDATE()),  DATEADD(DAY,-8,GETDATE())),
  (1,1,'Wi-Fi not available in venue','There is no guest Wi-Fi at the venue. Members waiting for sessions have no connectivity.',                     0 /*Open*/,       @CatOthers,'Others', NULL, DATEADD(DAY,-5,GETDATE()),  DATEADD(DAY,-5,GETDATE())),
  (1,1,'Lost item - water bottle','I left a blue water bottle in the changing room on 25 Mar. Please check lost and found.',                           2 /*Resolved*/,   @CatOthers,'Others', NULL, DATEADD(DAY,-3,GETDATE()),  DATEADD(DAY,-1,GETDATE()));
GO

-- ── 3. Add a few comments to the first 5 complaints ─────────
DECLARE @C1 INT = (SELECT TOP 1 Id FROM Complaints WHERE UserId=1 ORDER BY Id ASC);
DECLARE @C2 INT = (SELECT TOP 1 Id FROM Complaints WHERE UserId=1 ORDER BY Id ASC OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY);
DECLARE @C3 INT = (SELECT TOP 1 Id FROM Complaints WHERE UserId=1 ORDER BY Id ASC OFFSET 2 ROWS FETCH NEXT 1 ROWS ONLY);

IF @C1 IS NOT NULL
  INSERT INTO ComplaintComments (ComplaintId, UserId, Text, IsAdminComment, IsSystemComment, CreatedAt)
  VALUES
    (@C1, 1, 'I noticed this again yesterday morning. The thermometer showed 22C which is too cold for lap swimming.', 0, 0, DATEADD(DAY,-29,GETDATE())),
    (@C1, 1, 'Still not fixed. Has this been reported to maintenance?', 0, 0, DATEADD(DAY,-27,GETDATE()));

IF @C2 IS NOT NULL
  INSERT INTO ComplaintComments (ComplaintId, UserId, Text, IsAdminComment, IsSystemComment, CreatedAt)
  VALUES
    (@C2, 3, 'Thank you for reporting. Our maintenance team has been informed and will fix the lockers by end of week.', 1, 0, DATEADD(DAY,-27,GETDATE())),
    (@C2, 1, 'Thank you for the quick response. Please let me know when done.', 0, 0, DATEADD(DAY,-26,GETDATE())),
    (@C2, 3, 'Lockers 3, 5 and 7 have been repaired. Locker 9 needs a part order - estimated 3 days.', 1, 0, DATEADD(DAY,-25,GETDATE()));

IF @C3 IS NOT NULL
  INSERT INTO ComplaintComments (ComplaintId, UserId, Text, IsAdminComment, IsSystemComment, CreatedAt)
  VALUES
    (@C3, 3, 'The electrician inspected and replaced the faulty ballast. Please let us know if the issue recurs.', 1, 0, DATEADD(DAY,-22,GETDATE())),
    (@C3, 1, 'Confirmed, lights are working fine now. Thank you!', 0, 0, DATEADD(DAY,-21,GETDATE())),
    (@C3, 3, 'Glad to hear it. Marking as resolved.', 1, 0, DATEADD(DAY,-20,GETDATE()));

GO

PRINT 'Seed complete. Categories + 25 complaints + sample comments inserted.';
GO
