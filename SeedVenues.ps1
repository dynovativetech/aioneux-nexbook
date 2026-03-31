$venueBase = "C:\Users\sohai\source\repos\BookingPlatform.Api\BookingPlatform.Api\wwwroot\uploads\venues"
$server    = "MSM"
$database  = "BookingPlatformDb"

$imageSeeds = @{
    2 = @(20,22,24,26)
    3 = @(30,32,34,36)
    4 = @(40,42,44,46)
    5 = @(50,52,54,56)
    6 = @(60,62,64,66)
    7 = @(70,72,74,76)
    8 = @(80,82,84,86)
}

$captions = @{
    2 = @("Football Field","Tennis Courts","Badminton Hall","Club Entrance")
    3 = @("Olympic Swimming Pool","Squash Courts","Gym and Fitness Floor","Marina Waterfront View")
    4 = @("Basketball Arena","Cricket Ground","Arena Exterior","Multi-Purpose Hall")
    5 = @("Athletics Track","Indoor Arena","Fitness Complex","Spectator Stands")
    6 = @("Beach Volleyball Courts","Yoga Pavilion","Beachside Grounds","Sunset View")
    7 = @("Football Pitch","Swimming Pool","Sports Hall","Club Facilities")
    8 = @("Futsal Court","Table Tennis Hall","Sports Centre","Waterfront View")
}

Write-Host "Downloading venue images..."

$coverImages = @{}

foreach ($vid in $imageSeeds.Keys) {
    $dir = "$venueBase\$vid"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    $seeds = $imageSeeds[$vid]
    $caps  = $captions[$vid]
    $coverImages[$vid] = $null

    for ($i = 0; $i -lt $seeds.Count; $i++) {
        $seed  = $seeds[$i]
        $cap   = $caps[$i]
        $guid  = [System.Guid]::NewGuid().ToString()
        $fname = "$guid.jpg"
        $dest  = "$dir\$fname"
        $url   = "https://picsum.photos/seed/$seed/1200/800"

        try {
            Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 30
            Write-Host "  OK venue $vid image $i : $cap"
            if ($i -eq 0) { $coverImages[$vid] = $fname }

            $safeCaption = $cap -replace "'", "''"
            $isPrimary   = if ($i -eq 0) { 1 } else { 0 }
            sqlcmd -S $server -d $database -Q "INSERT INTO VenueImages (VenueId,FileName,OriginalFileName,FileSize,ContentType,IsPrimary,Caption,SortOrder) VALUES ($vid,'$fname','$fname',0,'image/jpeg',$isPrimary,'$safeCaption',$i);" 2>&1 | Out-Null
        } catch {
            Write-Host "  FAILED venue $vid image $i : $_"
        }
    }

    if ($coverImages[$vid]) {
        $cf = $coverImages[$vid]
        sqlcmd -S $server -d $database -Q "UPDATE Venues SET CoverImageUrl='/uploads/venues/$vid/$cf' WHERE Id=$vid;" 2>&1 | Out-Null
        Write-Host "  Cover set for venue $vid"
    }
}

Write-Host "Running SQL venue data seed..."

$sqlFile = "$env:TEMP\nexbook_venues.sql"

@"
-- Update venues with full details
UPDATE Venues SET
    Address='JVC District 12, Circle Mall Area, Jumeirah Village Circle, Dubai',
    Latitude=25.0657,Longitude=55.2093,
    Phone='+971 4 567 8901',Mobile='+971 55 123 4001',
    ContactPersonName='Ahmed Al Rashidi',ContactPersonEmail='ahmed@jvcsportsclub.ae',ContactPersonPhone='+971 55 123 4001',
    ShortDescription='Premier multi-sport facility serving the JVC community.',
    Description='JVC Sports Club offers world-class sports infrastructure including FIFA-standard football fields, professional tennis courts, and a dedicated badminton hall. Open to residents and visitors alike, the club hosts leagues, tournaments, and casual bookings year-round.',
    Website='https://jvcsportsclub.ae',
    GoogleMapsUrl='https://maps.google.com/?q=JVC+Sports+Club+Dubai',
    IsActive=1 WHERE Id=2;

UPDATE Venues SET
    Address='Marina Walk, Promenade Level, Dubai Marina, Dubai',
    Latitude=25.0819,Longitude=55.1367,
    Phone='+971 4 567 8902',Mobile='+971 55 123 4002',
    ContactPersonName='Sara Al Marzouqi',ContactPersonEmail='sara@marinaactive.ae',ContactPersonPhone='+971 55 123 4002',
    ShortDescription='Fitness and court sports on the iconic Dubai Marina waterfront.',
    Description='Marina Active Centre sits right on the Dubai Marina promenade, offering an Olympic-size swimming pool, squash courts, and a premium gym floor with panoramic marina views.',
    Website='https://marinaactivecentre.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Marina+Active+Centre+Dubai',
    IsActive=1 WHERE Id=3;

UPDATE Venues SET
    Address='Dubai Hills Boulevard, Dubai Hills Estate, Dubai',
    Latitude=25.0970,Longitude=55.2362,
    Phone='+971 4 567 8903',Mobile='+971 55 123 4003',
    ContactPersonName='Khalid Al Mansoori',ContactPersonEmail='khalid@dubaihillsarena.ae',ContactPersonPhone='+971 55 123 4003',
    ShortDescription='Premium sports arena nestled in the green heart of Dubai Hills.',
    Description='Dubai Hills Arena is a flagship multi-purpose sports destination featuring a full-size basketball court, a regulation cricket ground, and a flexible indoor hall. Surrounded by parkland, it offers an unmatched environment for competitive sport and community events.',
    Website='https://dubaihillsarena.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Dubai+Hills+Arena',
    IsActive=1 WHERE Id=4;

UPDATE Venues SET
    Address='Yas Island Sports District, Yas Island, Abu Dhabi',
    Latitude=24.4879,Longitude=54.6033,
    Phone='+971 2 567 8904',Mobile='+971 55 123 4004',
    ContactPersonName='Fatima Al Hosani',ContactPersonEmail='fatima@yasarenafitness.ae',ContactPersonPhone='+971 55 123 4004',
    ShortDescription='Olympic-grade sports complex on the world-famous Yas Island.',
    Description='Yas Arena Fitness is an internationally accredited sports complex located on Abu Dhabi Yas Island, home to Formula 1 and world-class entertainment. Features a full athletics track, a 5000-seat indoor arena, and specialised training zones.',
    Website='https://yasarenafitness.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Yas+Arena+Fitness+Abu+Dhabi',
    IsActive=1 WHERE Id=5;

UPDATE Venues SET
    Address='Saadiyat Island Cultural District, Saadiyat Island, Abu Dhabi',
    Latitude=24.5428,Longitude=54.4334,
    Phone='+971 2 567 8905',Mobile='+971 55 123 4005',
    ContactPersonName='Mariam Al Nuaimi',ContactPersonEmail='mariam@saadiyatsports.ae',ContactPersonPhone='+971 55 123 4005',
    ShortDescription='Beachside sports and wellness centre on Saadiyat Island.',
    Description='Saadiyat Sports Complex combines the serenity of Abu Dhabi most prestigious island with elite sports facilities. Beach volleyball courts face the Arabian Gulf, while the Yoga Pavilion offers a tranquil garden setting.',
    Website='https://saadiyatsports.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Saadiyat+Sports+Complex+Abu+Dhabi',
    IsActive=1 WHERE Id=6;

UPDATE Venues SET
    Address='Al Khalidiyah District, Near Corniche Road, Abu Dhabi',
    Latitude=24.4713,Longitude=54.3534,
    Phone='+971 2 567 8906',Mobile='+971 55 123 4006',
    ContactPersonName='Omar Al Dhaheri',ContactPersonEmail='omar@alkhalidiyahclub.ae',ContactPersonPhone='+971 55 123 4006',
    ShortDescription='Community sports and recreation hub in central Abu Dhabi.',
    Description='Al Khalidiyah Club has served the Abu Dhabi community for over 20 years, offering football pitches, a 25-metre swimming pool, and a multi-purpose sports hall. Membership plans available for families and individuals.',
    Website='https://alkhalidiyahclub.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Al+Khalidiyah+Club+Abu+Dhabi',
    IsActive=1 WHERE Id=7;

UPDATE Venues SET
    Address='Al Majaz Waterfront, Al Majaz 2, Sharjah',
    Latitude=25.3392,Longitude=55.3887,
    Phone='+971 6 567 8907',Mobile='+971 55 123 4007',
    ContactPersonName='Noor Al Qasimi',ContactPersonEmail='noor@almajazsc.ae',ContactPersonPhone='+971 55 123 4007',
    ShortDescription='Vibrant waterfront sports centre on Sharjah Al Majaz promenade.',
    Description='Al Majaz Sports Centre enjoys a stunning position on the Al Majaz waterfront. Features a futsal court with floodlights, a purpose-built table tennis hall, and open-air exercise areas. Evening tournaments and family sport days held weekly.',
    Website='https://almajazsc.ae',
    GoogleMapsUrl='https://maps.google.com/?q=Al+Majaz+Sports+Centre+Sharjah',
    IsActive=1 WHERE Id=8;

-- Operating Hours
INSERT INTO VenueOperatingHours (VenueId,DayOfWeek,OpenTime,CloseTime,IsClosed)
SELECT v,d,o,c,cl FROM (VALUES
  (2,0,'06:00','22:00',0),(2,1,'06:00','22:00',0),(2,2,'06:00','22:00',0),(2,3,'06:00','22:00',0),(2,4,'06:00','23:00',0),(2,5,'07:00','14:00',1),(2,6,'07:00','23:00',0),
  (3,0,'07:00','22:00',0),(3,1,'06:00','22:00',0),(3,2,'06:00','22:00',0),(3,3,'06:00','22:00',0),(3,4,'06:00','22:00',0),(3,5,'08:00','13:00',0),(3,6,'07:00','22:00',0),
  (4,0,'08:00','20:00',1),(4,1,'07:00','22:00',0),(4,2,'07:00','22:00',0),(4,3,'07:00','22:00',0),(4,4,'07:00','22:00',0),(4,5,'08:00','14:00',0),(4,6,'08:00','22:00',0),
  (5,0,'06:00','23:00',0),(5,1,'05:30','23:00',0),(5,2,'05:30','23:00',0),(5,3,'05:30','23:00',0),(5,4,'05:30','23:00',0),(5,5,'07:00','15:00',0),(5,6,'06:00','23:00',0),
  (6,0,'07:00','21:00',0),(6,1,'08:00','20:00',1),(6,2,'07:00','21:00',0),(6,3,'07:00','21:00',0),(6,4,'07:00','21:00',0),(6,5,'09:00','13:00',0),(6,6,'07:00','21:00',0),
  (7,0,'06:00','22:00',0),(7,1,'06:00','22:00',0),(7,2,'06:00','22:00',0),(7,3,'06:00','22:00',0),(7,4,'06:00','22:00',0),(7,5,'08:00','12:00',1),(7,6,'07:00','22:00',0),
  (8,0,'08:00','22:00',0),(8,1,'08:00','22:00',0),(8,2,'08:00','22:00',0),(8,3,'08:00','22:00',0),(8,4,'08:00','23:00',0),(8,5,'09:00','14:00',0),(8,6,'08:00','23:00',0)
) AS t(v,d,o,c,cl)
WHERE NOT EXISTS (SELECT 1 FROM VenueOperatingHours WHERE VenueId=t.v AND DayOfWeek=t.d);

-- Amenities (0=Parking 1=IndoorAC 2=MaleWashroom 3=FemaleWashroom 4=DisabledAccess 5=WiFi 6=ChangeRooms 7=Lockers 8=Cafeteria 9=FirstAid)
INSERT INTO VenueAmenities (VenueId,AmenityType,IsAvailable,Notes)
SELECT v,a,av,n FROM (VALUES
  (2,0,1,'200 free parking spaces'),(2,1,1,'Central air-conditioning'),(2,2,1,NULL),(2,3,1,NULL),(2,4,1,'Wheelchair accessible'),(2,5,1,'Free Wi-Fi'),(2,6,1,'Full change rooms with showers'),(2,7,1,'Coin-operated lockers'),(2,8,1,'Sports cafe on-site'),(2,9,1,'First-aid staff on duty'),
  (3,0,1,'Valet parking available'),(3,1,1,NULL),(3,2,1,NULL),(3,3,1,NULL),(3,4,1,'Lift access to all floors'),(3,5,1,'High-speed Wi-Fi'),(3,6,1,'Luxury changing rooms with sauna'),(3,7,1,'Electronic lockers'),(3,8,1,'Protein shake bar'),(3,9,1,'Defibrillator on-site'),
  (4,0,1,'500-space car park'),(4,1,1,NULL),(4,2,1,NULL),(4,3,1,NULL),(4,4,1,NULL),(4,5,1,NULL),(4,6,1,'Premium locker rooms'),(4,7,1,NULL),(4,8,1,'Full food court'),(4,9,1,NULL),
  (5,0,1,'Multi-storey car park'),(5,1,1,'Olympic-standard climate control'),(5,2,1,NULL),(5,3,1,NULL),(5,4,1,'Fully accessible'),(5,5,1,'Stadium-wide Wi-Fi'),(5,6,1,'Elite athlete changing suites'),(5,7,1,'Smart lockers'),(5,8,1,'Sports nutrition centre'),(5,9,1,'Medical team on-site'),
  (6,0,1,'Beach-side parking'),(6,1,0,'Open-air beach - AC not applicable'),(6,2,1,NULL),(6,3,1,NULL),(6,4,1,NULL),(6,5,1,'Free Wi-Fi in indoor areas'),(6,6,1,'Beach shower and change areas'),(6,7,0,NULL),(6,8,1,'Beach cafe and juice bar'),(6,9,1,NULL),
  (7,0,1,'Members parking bay'),(7,1,1,NULL),(7,2,1,NULL),(7,3,1,'Dedicated ladies section'),(7,4,1,NULL),(7,5,1,NULL),(7,6,1,NULL),(7,7,1,NULL),(7,8,1,'Canteen serving hot meals'),(7,9,1,NULL),
  (8,0,1,'Free waterfront parking'),(8,1,1,NULL),(8,2,1,NULL),(8,3,1,NULL),(8,4,1,NULL),(8,5,1,'Free Wi-Fi on promenade'),(8,6,1,NULL),(8,7,0,NULL),(8,8,1,'Waterfront kiosk'),(8,9,1,NULL)
) AS t(v,a,av,n)
WHERE NOT EXISTS (SELECT 1 FROM VenueAmenities WHERE VenueId=t.v AND AmenityType=t.a);

-- Facility full details
UPDATE Facilities SET ShortDescription='FIFA-regulation 7-a-side football turf with floodlights',Description='All-weather artificial turf football field meeting FIFA Quality Pro standards. Professional floodlights, automatic sprinklers, covered spectator stand for 100 people.',Location='Ground Floor - South Wing',Capacity=22,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Ahmed Al Rashidi',ContactEmail='bookings@jvcsportsclub.ae',ContactPhone='+971 4 567 8901',BookingConfirmationEmail='confirm@jvcsportsclub.ae',RequiresApproval=0,IsActive=1,Code='JVC-FF1',PhysicalAddress='JVC District 12, Dubai' WHERE Id=95;
UPDATE Facilities SET ShortDescription='Professional-grade hard court tennis with ball machine hire',Description='Two USTA-standard hard courts with LED lighting. Ball machine hire, racquet stringing, and certified coaching sessions available.',Location='Level 1 - East Wing',Capacity=4,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Ahmed Al Rashidi',ContactEmail='bookings@jvcsportsclub.ae',ContactPhone='+971 4 567 8901',BookingConfirmationEmail='confirm@jvcsportsclub.ae',RequiresApproval=0,IsActive=1,Code='JVC-TC1',PhysicalAddress='JVC District 12, Dubai' WHERE Id=96;
UPDATE Facilities SET ShortDescription='Air-conditioned badminton hall with BWF-approved courts',Description='Four BWF-approved courts in a fully air-conditioned hall. Synthetic wood flooring, high ceilings, professional lighting. Shuttlecocks and racquets for hire.',Location='Level 2 - North Hall',Capacity=16,SlotDurationMinutes=60,MaxConsecutiveSlots=4,ContactPersonName='Ahmed Al Rashidi',ContactEmail='bookings@jvcsportsclub.ae',ContactPhone='+971 4 567 8901',BookingConfirmationEmail='confirm@jvcsportsclub.ae',RequiresApproval=0,IsActive=1,Code='JVC-BH1',PhysicalAddress='JVC District 12, Dubai' WHERE Id=97;
UPDATE Facilities SET ShortDescription='50-metre Olympic pool with dedicated lap and leisure lanes',Description='Full 50-metre 10-lane Olympic swimming pool maintained at 27C. Separate leisure and warm-up pools. Lifeguards on duty at all times. Swimming lessons and aqua aerobics classes scheduled daily.',Location='Ground Floor - Pool Deck',Capacity=40,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Sara Al Marzouqi',ContactEmail='bookings@marinaactive.ae',ContactPhone='+971 4 567 8902',BookingConfirmationEmail='confirm@marinaactive.ae',RequiresApproval=0,IsActive=1,Code='MAC-OP1',PhysicalAddress='Marina Walk, Dubai Marina' WHERE Id=98;
UPDATE Facilities SET ShortDescription='Glass-backed squash courts with spectator gallery',Description='Two professional glass-backed squash courts conforming to WSF standards. LED lighting, air-conditioning, dedicated spectator gallery. Racquet hire available.',Location='Level 1 - Sports Wing',Capacity=4,SlotDurationMinutes=45,MaxConsecutiveSlots=4,ContactPersonName='Sara Al Marzouqi',ContactEmail='bookings@marinaactive.ae',ContactPhone='+971 4 567 8902',BookingConfirmationEmail='confirm@marinaactive.ae',RequiresApproval=0,IsActive=1,Code='MAC-SQ1',PhysicalAddress='Marina Walk, Dubai Marina' WHERE Id=99;
UPDATE Facilities SET ShortDescription='State-of-the-art gym with panoramic marina views',Description='Over 150 machines and free-weight stations with panoramic Dubai Marina views. Dedicated stretching area, functional fitness zone, daily group classes, personal trainers by appointment.',Location='Level 2 - Top Floor',Capacity=30,SlotDurationMinutes=60,MaxConsecutiveSlots=4,ContactPersonName='Sara Al Marzouqi',ContactEmail='bookings@marinaactive.ae',ContactPhone='+971 4 567 8902',BookingConfirmationEmail='confirm@marinaactive.ae',RequiresApproval=0,IsActive=1,Code='MAC-GF1',PhysicalAddress='Marina Walk, Dubai Marina' WHERE Id=100;
UPDATE Facilities SET ShortDescription='NBA-regulation hardwood basketball court',Description='Full-size NBA-specification hardwood basketball court with electronic scoreboard, 24-second shot clocks, and 500-seat spectator stand. Hosts district-level competitions and corporate events.',Location='Main Hall - Ground Floor',Capacity=12,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Khalid Al Mansoori',ContactEmail='bookings@dubaihillsarena.ae',ContactPhone='+971 4 567 8903',BookingConfirmationEmail='confirm@dubaihillsarena.ae',RequiresApproval=1,IsActive=1,Code='DHA-BK1',PhysicalAddress='Dubai Hills Boulevard, Dubai Hills Estate' WHERE Id=101;
UPDATE Facilities SET ShortDescription='Full-size cricket ground with turf and synthetic pitches',Description='Regulation-size cricket ground with a high-quality turf strip and two synthetic practice pitches. Covered pavilion for teams, scoring hut, equipment storage. Suitable for T20 and one-day matches.',Location='Outdoor - North Grounds',Capacity=22,SlotDurationMinutes=120,MaxConsecutiveSlots=4,ContactPersonName='Khalid Al Mansoori',ContactEmail='bookings@dubaihillsarena.ae',ContactPhone='+971 4 567 8903',BookingConfirmationEmail='confirm@dubaihillsarena.ae',RequiresApproval=1,IsActive=1,Code='DHA-CG1',PhysicalAddress='Dubai Hills Boulevard, Dubai Hills Estate' WHERE Id=102;
UPDATE Facilities SET ShortDescription='400-metre IAAF-certified athletics track',Description='An 8-lane 400-metre athletics track certified by World Athletics. Polyurethane surface with field event areas including long jump, triple jump, shot put, and javelin.',Location='Outdoor - Stadium',Capacity=48,SlotDurationMinutes=60,MaxConsecutiveSlots=4,ContactPersonName='Fatima Al Hosani',ContactEmail='bookings@yasarenafitness.ae',ContactPhone='+971 2 567 8904',BookingConfirmationEmail='confirm@yasarenafitness.ae',RequiresApproval=1,IsActive=1,Code='YAS-AT1',PhysicalAddress='Yas Island Sports District, Abu Dhabi' WHERE Id=103;
UPDATE Facilities SET ShortDescription='5000-seat multi-purpose indoor arena',Description='Fully air-conditioned 5000-seat indoor arena suitable for basketball, volleyball, futsal, boxing, and large-scale events. Competition-grade sprung floor, retractable seating, broadcast-quality lighting.',Location='Main Arena Building',Capacity=60,SlotDurationMinutes=90,MaxConsecutiveSlots=4,ContactPersonName='Fatima Al Hosani',ContactEmail='bookings@yasarenafitness.ae',ContactPhone='+971 2 567 8904',BookingConfirmationEmail='confirm@yasarenafitness.ae',RequiresApproval=1,IsActive=1,Code='YAS-IA1',PhysicalAddress='Yas Island Sports District, Abu Dhabi' WHERE Id=104;
UPDATE Facilities SET ShortDescription='Beachside sand volleyball courts facing the Arabian Gulf',Description='Four international-standard beach volleyball courts on pristine white sand. Nets, balls, boundary markers provided. Evening floodlights for sunset and night play.',Location='Beachfront - Court Area',Capacity=12,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Mariam Al Nuaimi',ContactEmail='bookings@saadiyatsports.ae',ContactPhone='+971 2 567 8905',BookingConfirmationEmail='confirm@saadiyatsports.ae',RequiresApproval=0,IsActive=1,Code='SAA-BV1',PhysicalAddress='Saadiyat Island, Abu Dhabi' WHERE Id=105;
UPDATE Facilities SET ShortDescription='Tranquil garden yoga pavilion with sea breeze',Description='A shaded open-sided yoga pavilion set within a landscaped garden. Accommodates 25 participants with premium eco-friendly mats. Daily sunrise, morning, and evening yoga and pilates sessions.',Location='Garden Level - West Pavilion',Capacity=25,SlotDurationMinutes=60,MaxConsecutiveSlots=4,ContactPersonName='Mariam Al Nuaimi',ContactEmail='bookings@saadiyatsports.ae',ContactPhone='+971 2 567 8905',BookingConfirmationEmail='confirm@saadiyatsports.ae',RequiresApproval=0,IsActive=1,Code='SAA-YP1',PhysicalAddress='Saadiyat Island, Abu Dhabi' WHERE Id=106;
UPDATE Facilities SET ShortDescription='Grass football pitch with floodlights and spectator seating',Description='Full-size natural grass football pitch maintained to FA standards. Floodlighting for evening matches and seating for 200 spectators. Youth leagues and adult competitions hosted regularly.',Location='Ground Floor - Main Field',Capacity=22,SlotDurationMinutes=90,MaxConsecutiveSlots=3,ContactPersonName='Omar Al Dhaheri',ContactEmail='bookings@alkhalidiyahclub.ae',ContactPhone='+971 2 567 8906',BookingConfirmationEmail='confirm@alkhalidiyahclub.ae',RequiresApproval=0,IsActive=1,Code='AKC-FP1',PhysicalAddress='Al Khalidiyah District, Abu Dhabi' WHERE Id=107;
UPDATE Facilities SET ShortDescription='25-metre community pool with separate ladies sessions',Description='A 6-lane 25-metre swimming pool with general and ladies-only sessions. Water at 28C year-round. Group swimming lessons for children ages 4+ and adults. Competitive swim squad on weekday mornings.',Location='Level 1 - Aquatics Centre',Capacity=30,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Omar Al Dhaheri',ContactEmail='bookings@alkhalidiyahclub.ae',ContactPhone='+971 2 567 8906',BookingConfirmationEmail='confirm@alkhalidiyahclub.ae',RequiresApproval=0,IsActive=1,Code='AKC-SP1',PhysicalAddress='Al Khalidiyah District, Abu Dhabi' WHERE Id=108;
UPDATE Facilities SET ShortDescription='Floodlit waterfront futsal court open until 11 pm',Description='FIFA-standard futsal court with artificial grass, electronic scoreboard, and full floodlighting. On the Al Majaz promenade with views of Khalid Lake. Weekly futsal leagues and drop-in sessions.',Location='Ground Floor - Promenade Court',Capacity=12,SlotDurationMinutes=60,MaxConsecutiveSlots=3,ContactPersonName='Noor Al Qasimi',ContactEmail='bookings@almajazsc.ae',ContactPhone='+971 6 567 8907',BookingConfirmationEmail='confirm@almajazsc.ae',RequiresApproval=0,IsActive=1,Code='AMZ-FC1',PhysicalAddress='Al Majaz Waterfront, Sharjah' WHERE Id=109;
UPDATE Facilities SET ShortDescription='Dedicated table tennis hall with ITTF-approved tables',Description='Eight ITTF-approved table tennis tables in a dedicated climate-controlled hall. Bats and balls provided. Suitable for casual play, coaching, and club competitions. Hosts Sharjah Open TT Championship annually.',Location='Level 1 - Table Tennis Hall',Capacity=16,SlotDurationMinutes=60,MaxConsecutiveSlots=4,ContactPersonName='Noor Al Qasimi',ContactEmail='bookings@almajazsc.ae',ContactPhone='+971 6 567 8907',BookingConfirmationEmail='confirm@almajazsc.ae',RequiresApproval=0,IsActive=1,Code='AMZ-TT1',PhysicalAddress='Al Majaz Waterfront, Sharjah' WHERE Id=110;

PRINT 'Venue seed complete.';
GO
"@ | Out-File -FilePath $sqlFile -Encoding UTF8

sqlcmd -S $server -d $database -i $sqlFile
Remove-Item $sqlFile -Force

Write-Host "Done."
