using BookingPlatform.Api.Data;
using BookingPlatform.Api.DTOs;
using BookingPlatform.Api.Entities;
using BookingPlatform.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VenueController : ControllerBase
    {
        private readonly AppDbContext       _db;
        private readonly IAuditService      _audit;
        private readonly ITenantContext     _tenantContext;
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        private const long MaxImageBytes = 10 * 1024 * 1024; // 10 MB

        public VenueController(
            AppDbContext db,
            IAuditService audit,
            ITenantContext tenantContext,
            IWebHostEnvironment env)
        {
            _db            = db;
            _audit         = audit;
            _tenantContext = tenantContext;
            _env           = env;
        }

        // ════════════════════════════════════════════════════════════════════
        // List / Search
        // ════════════════════════════════════════════════════════════════════

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int?    tenantId     = null,
            [FromQuery] int?    communityId  = null,
            [FromQuery] bool?   activeOnly   = null,
            [FromQuery] string? search       = null)
        {
            IQueryable<Venue> query = _db.Venues
                .Include(v => v.Community!).ThenInclude(c => c.Area!).ThenInclude(a => a.City!).ThenInclude(c => c.Country)
                .Include(v => v.Facilities);

            if (_tenantContext.IsSuperAdmin && tenantId.HasValue)
                query = _db.Venues.IgnoreQueryFilters()
                    .Include(v => v.Community!).ThenInclude(c => c.Area)
                    .Include(v => v.Facilities)
                    .Where(v => v.TenantId == tenantId.Value);

            if (communityId.HasValue) query = query.Where(v => v.CommunityId == communityId);
            if (activeOnly == true)   query = query.Where(v => v.IsActive);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(v => v.Name.Contains(search) || v.Address.Contains(search));

            var venues = await query.AsNoTracking().ToListAsync();
            return Ok(venues.Select(MapToListItem));
        }

        /// <summary>Returns venues assigned to the currently logged-in organizer.</summary>
        [HttpGet("my-venues")]
        [Authorize(Roles = $"{Roles.FacilityOrganizer},{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> GetMyVenues()
        {
            var userId = _tenantContext.UserId;

            var venues = await _db.VenueOrganizers
                .Where(vo => vo.UserId == userId)
                .Select(vo => vo.VenueId)
                .ToListAsync();

            var result = await _db.Venues
                .Include(v => v.Facilities)
                .Include(v => v.Community!).ThenInclude(c => c.Area)
                .AsNoTracking()
                .Where(v => venues.Contains(v.Id))
                .ToListAsync();

            return Ok(result.Select(MapToListItem));
        }

        /// <summary>Bookings for all venues assigned to the caller (organizer view).</summary>
        [HttpGet("my-bookings")]
        [Authorize(Roles = $"{Roles.FacilityOrganizer},{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> GetOrganizerBookings(
            [FromQuery] string? status = null,
            [FromQuery] string? date   = null)
        {
            var userId = _tenantContext.UserId;

            var myVenueIds = await _db.VenueOrganizers
                .Where(vo => vo.UserId == userId)
                .Select(vo => vo.VenueId)
                .ToListAsync();

            var myFacilityIds = await _db.Facilities
                .Where(f => f.VenueId != null && myVenueIds.Contains(f.VenueId!.Value))
                .Select(f => f.Id)
                .ToListAsync();

            var query = _db.Bookings
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations)
                .AsNoTracking()
                .Where(b => myFacilityIds.Contains(b.FacilityId));

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, true, out var st))
                query = query.Where(b => b.Status == st);

            if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var d))
                query = query.Where(b =>
                    b.FacilityReservations.Any(r => r.ReservationDate.Date == d.Date));

            var bookings = await query
                .OrderByDescending(b => b.CreatedAt)
                .Take(200)
                .ToListAsync();

            return Ok(bookings);
        }

        /// <summary>Full venue detail including images, hours, amenities, organizers.</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var venue = await LoadFullVenueAsync(id);
            if (venue is null) return NotFound();
            return Ok(MapToResponse(venue));
        }

        // ════════════════════════════════════════════════════════════════════
        // CRUD
        // ════════════════════════════════════════════════════════════════════

        [HttpPost]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create([FromBody] CreateVenueRequest req)
        {
            var tenantId = _tenantContext.TenantId ?? 1;

            var venue = new Venue
            {
                TenantId           = tenantId,
                CommunityId        = req.CommunityId,
                Name               = req.Name.Trim(),
                ShortDescription   = req.ShortDescription?.Trim(),
                Description        = req.Description?.Trim(),
                Address            = req.Address.Trim(),
                Latitude           = req.Latitude,
                Longitude          = req.Longitude,
                GoogleMapsUrl      = req.GoogleMapsUrl?.Trim(),
                Phone                = req.Phone?.Trim(),
                Mobile               = req.Mobile?.Trim(),
                Website              = req.Website?.Trim(),
                ContactPersonName    = req.ContactPersonName?.Trim(),
                ContactPersonEmail   = req.ContactPersonEmail?.Trim(),
                ContactPersonPhone   = req.ContactPersonPhone?.Trim(),
                ContactPersonMobile  = req.ContactPersonMobile?.Trim(),
                IsActive             = req.IsActive
            };

            _db.Venues.Add(venue);
            await _db.SaveChangesAsync();

            await _audit.LogAsync("Create", "Venue", venue.Id, venue.Name,
                $"Venue '{venue.Name}' created in community #{venue.CommunityId}.");

            return CreatedAtAction(nameof(GetById), new { id = venue.Id },
                ApiResponse<int>.Ok(venue.Id, "Venue created."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateVenueRequest req)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            venue.CommunityId        = req.CommunityId;
            venue.Name               = req.Name.Trim();
            venue.ShortDescription   = req.ShortDescription?.Trim();
            venue.Description        = req.Description?.Trim();
            venue.Address            = req.Address.Trim();
            venue.Latitude           = req.Latitude;
            venue.Longitude          = req.Longitude;
            venue.GoogleMapsUrl      = req.GoogleMapsUrl?.Trim();
            venue.Phone                = req.Phone?.Trim();
            venue.Mobile               = req.Mobile?.Trim();
            venue.Website              = req.Website?.Trim();
            venue.ContactPersonName    = req.ContactPersonName?.Trim();
            venue.ContactPersonEmail   = req.ContactPersonEmail?.Trim();
            venue.ContactPersonPhone   = req.ContactPersonPhone?.Trim();
            venue.ContactPersonMobile  = req.ContactPersonMobile?.Trim();
            venue.IsActive           = req.IsActive;

            await _db.SaveChangesAsync();
            await _audit.LogAsync("Update", "Venue", id, req.Name, $"Venue #{id} updated.");

            return Ok(ApiResponse<string>.Ok("Updated", "Venue updated."));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            _db.Venues.Remove(venue);
            await _db.SaveChangesAsync();

            await _audit.LogAsync("Delete", "Venue", id, venue.Name, $"Venue '{venue.Name}' deleted.");
            return NoContent();
        }

        // ════════════════════════════════════════════════════════════════════
        // Image upload
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Upload a gallery image for a venue (multipart/form-data).</summary>
        [HttpPost("{id:int}/images")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin},{Roles.FacilityOrganizer}")]
        public async Task<IActionResult> UploadImage(
            int id,
            IFormFile file,
            [FromForm] string? caption = null,
            [FromForm] bool isPrimary  = false)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            if (file is null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("No file provided."));

            if (!AllowedImageTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(ApiResponse<string>.Fail("Only JPEG, PNG, WebP or GIF images are allowed."));

            if (file.Length > MaxImageBytes)
                return BadRequest(ApiResponse<string>.Fail("Image must be smaller than 10 MB."));

            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "venues", id.ToString());
            Directory.CreateDirectory(uploadsDir);

            var storedName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath   = Path.Combine(uploadsDir, storedName);

            await using (var stream = System.IO.File.Create(filePath))
                await file.CopyToAsync(stream);

            // If this image is primary, demote all existing primary flags
            if (isPrimary)
                await _db.VenueImages.Where(i => i.VenueId == id && i.IsPrimary)
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsPrimary, false));

            var existingCount = await _db.VenueImages.CountAsync(i => i.VenueId == id);
            var image = new VenueImage
            {
                VenueId          = id,
                FileName         = storedName,
                OriginalFileName = file.FileName,
                FileSize         = file.Length,
                ContentType      = file.ContentType,
                IsPrimary        = isPrimary,
                Caption          = caption?.Trim(),
                SortOrder        = existingCount
            };

            _db.VenueImages.Add(image);
            await _db.SaveChangesAsync();

            // If this is the first image, set it as cover
            if (isPrimary || existingCount == 0)
            {
                venue.CoverImageUrl = $"/uploads/venues/{id}/{storedName}";
                await _db.SaveChangesAsync();
            }

            return Ok(ApiResponse<VenueImageResponse>.Ok(MapImage(image, id), "Image uploaded."));
        }

        /// <summary>Upload logo (single file, replaces any existing logo).</summary>
        [HttpPost("{id:int}/logo")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin},{Roles.FacilityOrganizer}")]
        public async Task<IActionResult> UploadLogo(int id, IFormFile file)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            if (file is null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("No file provided."));

            if (!AllowedImageTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(ApiResponse<string>.Fail("Only image files are accepted."));

            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "venues", id.ToString(), "logos");
            Directory.CreateDirectory(uploadsDir);

            // Delete old logo file if exists
            if (!string.IsNullOrWhiteSpace(venue.LogoUrl))
            {
                var oldPath = Path.Combine(_env.WebRootPath ?? "wwwroot", venue.LogoUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            var storedName = $"logo_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath   = Path.Combine(uploadsDir, storedName);

            await using (var stream = System.IO.File.Create(filePath))
                await file.CopyToAsync(stream);

            venue.LogoUrl = $"/uploads/venues/{id}/logos/{storedName}";
            await _db.SaveChangesAsync();

            return Ok(ApiResponse<string>.Ok(venue.LogoUrl, "Logo uploaded."));
        }

        [HttpDelete("{id:int}/images/{imageId:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin},{Roles.FacilityOrganizer}")]
        public async Task<IActionResult> DeleteImage(int id, int imageId)
        {
            var image = await _db.VenueImages.FirstOrDefaultAsync(i => i.Id == imageId && i.VenueId == id);
            if (image is null) return NotFound();

            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "venues", id.ToString(), image.FileName);
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

            _db.VenueImages.Remove(image);
            await _db.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, "Image deleted."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Operating hours
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("{id:int}/hours")]
        public async Task<IActionResult> GetHours(int id)
        {
            var hours = await _db.VenueOperatingHours
                .Where(h => h.VenueId == id)
                .OrderBy(h => h.DayOfWeek)
                .AsNoTracking()
                .ToListAsync();

            return Ok(hours.Select(MapHours));
        }

        /// <summary>
        /// Set operating hours for a venue (full replace — send all 7 days).
        /// Organizer can also call this endpoint for their assigned venue.
        /// </summary>
        [HttpPut("{id:int}/hours")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin},{Roles.FacilityOrganizer}")]
        public async Task<IActionResult> SetHours(int id, [FromBody] SetOperatingHoursRequest req)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            // Remove all existing rows then insert fresh (simpler than upsert)
            var existing = await _db.VenueOperatingHours.Where(h => h.VenueId == id).ToListAsync();
            _db.VenueOperatingHours.RemoveRange(existing);

            foreach (var h in req.Hours)
            {
                _db.VenueOperatingHours.Add(new VenueOperatingHours
                {
                    VenueId   = id,
                    DayOfWeek = h.DayOfWeek,
                    OpenTime  = TimeSpan.Parse(h.OpenTime),
                    CloseTime = TimeSpan.Parse(h.CloseTime),
                    IsClosed  = h.IsClosed
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync("Update", "VenueHours", id, venue.Name, "Operating hours updated.");

            return Ok(ApiResponse<bool>.Ok(true, "Operating hours updated."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Amenities
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("{id:int}/amenities")]
        public async Task<IActionResult> GetAmenities(int id)
        {
            var amenities = await _db.VenueAmenities
                .Where(a => a.VenueId == id)
                .AsNoTracking()
                .ToListAsync();

            return Ok(amenities.Select(a => new VenueAmenityDto
            {
                Id          = a.Id,
                AmenityType = a.AmenityType,
                IsAvailable = a.IsAvailable,
                Notes       = a.Notes
            }));
        }

        /// <summary>Set all amenities for a venue (full replace).</summary>
        [HttpPut("{id:int}/amenities")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> SetAmenities(int id, [FromBody] SetAmenitiesRequest req)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound();

            var existing = await _db.VenueAmenities.Where(a => a.VenueId == id).ToListAsync();
            _db.VenueAmenities.RemoveRange(existing);

            foreach (var a in req.Amenities)
            {
                _db.VenueAmenities.Add(new VenueAmenity
                {
                    VenueId     = id,
                    AmenityType = a.AmenityType,
                    IsAvailable = a.IsAvailable,
                    Notes       = a.Notes?.Trim()
                });
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync("Update", "VenueAmenities", id, venue.Name, "Amenities updated.");

            return Ok(ApiResponse<bool>.Ok(true, "Amenities updated."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Organizers
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("{id:int}/organizers")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> GetOrganizers(int id)
        {
            var organizers = await _db.VenueOrganizers
                .Include(o => o.User)
                .Where(o => o.VenueId == id)
                .AsNoTracking()
                .ToListAsync();

            return Ok(organizers.Select(MapOrganizer));
        }

        [HttpPost("{id:int}/organizers")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> AssignOrganizer(int id, [FromBody] AssignOrganizerRequest req)
        {
            var venue = await _db.Venues.FindAsync(id);
            if (venue is null) return NotFound("Venue not found.");

            var user = await _db.Users.FindAsync(req.UserId);
            if (user is null) return NotFound("User not found.");

            if (user.Role != Roles.FacilityOrganizer)
                return BadRequest(ApiResponse<string>.Fail("User must have the FacilityOrganizer role."));

            // Upsert — update if already assigned
            var existing = await _db.VenueOrganizers
                .FirstOrDefaultAsync(o => o.VenueId == id && o.UserId == req.UserId);

            if (existing is null)
            {
                _db.VenueOrganizers.Add(new VenueOrganizer
                {
                    VenueId       = id,
                    UserId        = req.UserId,
                    FirstName     = req.FirstName?.Trim(),
                    LastName      = req.LastName?.Trim(),
                    Email         = req.Email?.Trim(),
                    OfficialEmail = req.OfficialEmail?.Trim(),
                    Phone         = req.Phone?.Trim(),
                    Mobile        = req.Mobile?.Trim(),
                    Website       = req.Website?.Trim(),
                    AssignedAt    = DateTime.UtcNow
                });
            }
            else
            {
                existing.FirstName     = req.FirstName?.Trim();
                existing.LastName      = req.LastName?.Trim();
                existing.Email         = req.Email?.Trim();
                existing.OfficialEmail = req.OfficialEmail?.Trim();
                existing.Phone         = req.Phone?.Trim();
                existing.Mobile        = req.Mobile?.Trim();
                existing.Website       = req.Website?.Trim();
            }

            await _db.SaveChangesAsync();
            await _audit.LogAsync("Update", "VenueOrganizer", id, venue.Name,
                $"User #{req.UserId} assigned as organizer for venue '{venue.Name}'.");

            return Ok(ApiResponse<bool>.Ok(true, "Organizer assigned."));
        }

        [HttpDelete("{id:int}/organizers/{userId:int}")]
        [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> RemoveOrganizer(int id, int userId)
        {
            var org = await _db.VenueOrganizers
                .FirstOrDefaultAsync(o => o.VenueId == id && o.UserId == userId);

            if (org is null) return NotFound();

            _db.VenueOrganizers.Remove(org);
            await _db.SaveChangesAsync();

            await _audit.LogAsync("Delete", "VenueOrganizer", id, $"VenueId={id}",
                $"User #{userId} removed from venue #{id}.");

            return Ok(ApiResponse<bool>.Ok(true, "Organizer removed."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Booking approval (organizer confirms/rejects)
        // ════════════════════════════════════════════════════════════════════

        [HttpPost("bookings/{bookingId:int}/confirm")]
        [Authorize(Roles = $"{Roles.FacilityOrganizer},{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> ConfirmBooking(
            int bookingId,
            [FromServices] INotificationService notifications)
        {
            var booking = await _db.Bookings
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking is null)
                return NotFound(ApiResponse<bool>.NotFound($"Booking #{bookingId} not found."));

            if (booking.Status != BookingStatus.Pending)
                return BadRequest(ApiResponse<bool>.Fail("Only pending bookings can be confirmed."));

            booking.Status    = BookingStatus.Confirmed;
            booking.UpdatedAt = DateTime.UtcNow;
            foreach (var r in booking.FacilityReservations)  r.Status = ReservationStatus.Confirmed;
            foreach (var r in booking.InstructorReservations) r.Status = ReservationStatus.Confirmed;

            await _db.SaveChangesAsync();
            await _audit.LogAsync("StatusChange", "Booking", bookingId, $"Booking #{bookingId}", "Confirmed by organizer.");

            try { await notifications.NotifyBookingConfirmedAsync(bookingId); }
            catch { /* notification failure must not affect the response */ }

            return Ok(ApiResponse<bool>.Ok(true, "Booking confirmed."));
        }

        [HttpPost("bookings/{bookingId:int}/reject")]
        [Authorize(Roles = $"{Roles.FacilityOrganizer},{Roles.TenantAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> RejectBooking(
            int bookingId,
            [FromBody] string reason,
            [FromServices] INotificationService notifications)
        {
            var booking = await _db.Bookings
                .Include(b => b.FacilityReservations)
                .Include(b => b.InstructorReservations)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking is null)
                return NotFound(ApiResponse<bool>.NotFound($"Booking #{bookingId} not found."));

            if (booking.Status != BookingStatus.Pending)
                return BadRequest(ApiResponse<bool>.Fail("Only pending bookings can be rejected."));

            booking.Status    = BookingStatus.Cancelled;
            booking.UpdatedAt = DateTime.UtcNow;
            foreach (var r in booking.FacilityReservations)  r.Status = ReservationStatus.Cancelled;
            foreach (var r in booking.InstructorReservations) r.Status = ReservationStatus.Cancelled;

            await _db.SaveChangesAsync();
            await _audit.LogAsync("StatusChange", "Booking", bookingId, $"Booking #{bookingId}",
                $"Rejected by organizer. Reason: {reason}");

            try { await notifications.NotifyBookingRejectedAsync(bookingId, reason ?? ""); }
            catch { /* notification failure must not affect the response */ }

            return Ok(ApiResponse<bool>.Ok(true, "Booking rejected."));
        }

        // ════════════════════════════════════════════════════════════════════
        // Private helpers
        // ════════════════════════════════════════════════════════════════════

        private async Task<Venue?> LoadFullVenueAsync(int id) =>
            await _db.Venues
                .Include(v => v.Community!).ThenInclude(c => c.Area!).ThenInclude(a => a.City!).ThenInclude(c => c.Country)
                .Include(v => v.Images)
                .Include(v => v.OperatingHours)
                .Include(v => v.Amenities)
                .Include(v => v.Organizers).ThenInclude(o => o.User)
                .Include(v => v.Facilities)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == id);

        private static VenueListItem MapToListItem(Venue v) => new()
        {
            Id               = v.Id,
            Name             = v.Name,
            ShortDescription = v.ShortDescription,
            Address          = v.Address,
            CoverImageUrl    = v.CoverImageUrl,
            LogoUrl          = v.LogoUrl,
            CommunityName    = v.Community?.Name ?? string.Empty,
            IsActive         = v.IsActive,
            FacilityCount    = v.Facilities.Count
        };

        private static VenueResponse MapToResponse(Venue v) => new()
        {
            Id                 = v.Id,
            CommunityId        = v.CommunityId,
            CommunityName      = v.Community?.Name ?? string.Empty,
            TenantId           = v.TenantId,
            Name               = v.Name,
            ShortDescription   = v.ShortDescription,
            Description        = v.Description,
            Address            = v.Address,
            Latitude           = v.Latitude,
            Longitude          = v.Longitude,
            GoogleMapsUrl      = v.GoogleMapsUrl,
            LogoUrl            = v.LogoUrl,
            CoverImageUrl      = v.CoverImageUrl,
            Phone                = v.Phone,
            Mobile               = v.Mobile,
            Website              = v.Website,
            ContactPersonName    = v.ContactPersonName,
            ContactPersonEmail   = v.ContactPersonEmail,
            ContactPersonPhone   = v.ContactPersonPhone,
            ContactPersonMobile  = v.ContactPersonMobile,
            IsActive           = v.IsActive,
            FacilityCount      = v.Facilities.Count,
            Images             = v.Images.OrderBy(i => i.SortOrder)
                                     .Select(i => MapImage(i, v.Id)).ToList(),
            OperatingHours     = v.OperatingHours.OrderBy(h => h.DayOfWeek)
                                     .Select(MapHours).ToList(),
            Amenities          = v.Amenities.Select(a => new VenueAmenityDto
                                 {
                                     Id = a.Id, AmenityType = a.AmenityType,
                                     IsAvailable = a.IsAvailable, Notes = a.Notes
                                 }).ToList(),
            Organizers         = v.Organizers.Select(MapOrganizer).ToList()
        };

        private static VenueImageResponse MapImage(VenueImage i, int venueId) => new()
        {
            Id               = i.Id,
            FileName         = i.FileName,
            OriginalFileName = i.OriginalFileName,
            IsPrimary        = i.IsPrimary,
            Caption          = i.Caption,
            SortOrder        = i.SortOrder,
            Url              = $"/uploads/venues/{venueId}/{i.FileName}"
        };

        private static VenueOperatingHoursDto MapHours(VenueOperatingHours h) => new()
        {
            Id        = h.Id,
            DayOfWeek = h.DayOfWeek,
            OpenTime  = h.OpenTime.ToString(@"hh\:mm"),
            CloseTime = h.CloseTime.ToString(@"hh\:mm"),
            IsClosed  = h.IsClosed
        };

        private static VenueOrganizerResponse MapOrganizer(VenueOrganizer o) => new()
        {
            UserId        = o.UserId,
            UserName      = o.User?.FullName ?? string.Empty,
            UserEmail     = o.User?.Email    ?? string.Empty,
            FirstName     = o.FirstName,
            LastName      = o.LastName,
            Email         = o.Email,
            OfficialEmail = o.OfficialEmail,
            Phone         = o.Phone,
            Mobile        = o.Mobile,
            Website       = o.Website,
            AssignedAt    = o.AssignedAt
        };
    }
}
