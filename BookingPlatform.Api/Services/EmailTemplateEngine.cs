namespace BookingPlatform.Api.Services
{
    /// <summary>
    /// Generates HTML email bodies for each notification event.
    /// All methods are static — no dependencies, easy to unit-test.
    /// Wrap the generated body in a layout using Wrap() for consistent branding.
    /// </summary>
    public static class EmailTemplateEngine
    {
        // ── Layout ────────────────────────────────────────────────────────────

        private static string Wrap(string title, string content, string platformName = "NexBook") => $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8""/>
  <meta name=""viewport"" content=""width=device-width,initial-scale=1""/>
  <title>{title}</title>
  <style>
    body {{ margin:0; padding:0; background:#f4f6f8; font-family:Arial,sans-serif; color:#333; }}
    .wrap {{ max-width:600px; margin:32px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }}
    .header {{ background:#1e3a5f; padding:24px 32px; }}
    .header h1 {{ margin:0; color:#fff; font-size:20px; font-weight:600; }}
    .body {{ padding:32px; }}
    .body h2 {{ color:#1e3a5f; font-size:18px; margin-top:0; }}
    .body p {{ line-height:1.6; margin:8px 0; }}
    .box {{ background:#f0f4f8; border-radius:6px; padding:16px 20px; margin:20px 0; }}
    .box .row {{ display:flex; justify-content:space-between; padding:4px 0; font-size:14px; }}
    .box .label {{ color:#666; }}
    .box .value {{ font-weight:600; color:#1e3a5f; }}
    .badge {{ display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }}
    .badge-pending {{ background:#fff3cd; color:#856404; }}
    .badge-confirmed {{ background:#d1fae5; color:#065f46; }}
    .badge-cancelled {{ background:#fee2e2; color:#991b1b; }}
    .btn {{ display:inline-block; margin-top:20px; padding:12px 28px; background:#1e3a5f; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:600; }}
    .footer {{ background:#f8f9fa; padding:16px 32px; font-size:12px; color:#999; text-align:center; }}
    hr {{ border:none; border-top:1px solid #eee; margin:20px 0; }}
  </style>
</head>
<body>
  <div class=""wrap"">
    <div class=""header""><h1>{platformName}</h1></div>
    <div class=""body"">{content}</div>
    <div class=""footer"">© {DateTime.UtcNow.Year} {platformName}. This is an automated message — please do not reply.</div>
  </div>
</body>
</html>";

        // ── Booking Created ───────────────────────────────────────────────────

        public static string BookingCreatedCustomer(
            string customerName, string venueName, string facilityName,
            string activityName, DateTime date, DateTime start, DateTime end,
            int participants, string refNo, bool isPending) => Wrap(
            "Booking Confirmation",
            $@"<h2>Your booking is {(isPending ? "received" : "confirmed")}!</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Thank you for your booking at <strong>{Esc(venueName)}</strong>.
               {(isPending ? "Your slot is held and is awaiting organizer confirmation." : "Your slot is confirmed.")}</p>
               {BookingBox(refNo, facilityName, activityName, date, start, end, participants, isPending ? "Pending" : "Confirmed")}
               <p>We'll send you an update once the organizer reviews your booking.</p>");

        public static string BookingCreatedOrganizer(
            string organizerName, string customerName, string customerEmail,
            string facilityName, string activityName, DateTime date,
            DateTime start, DateTime end, int participants, string refNo) => Wrap(
            "New Booking",
            $@"<h2>New booking received</h2>
               <p>Hi {Esc(organizerName)},</p>
               <p>A new booking has been made by <strong>{Esc(customerName)}</strong> ({Esc(customerEmail)}).</p>
               {BookingBox(refNo, facilityName, activityName, date, start, end, participants, "Pending")}
               <p>Please log in to confirm or reject this booking.</p>");

        public static string BookingCreatedAdmin(
            string adminName, string customerName, string venueName,
            string facilityName, string activityName, DateTime date,
            DateTime start, DateTime end, string refNo) => Wrap(
            "New Booking Alert",
            $@"<h2>New booking alert</h2>
               <p>Hi {Esc(adminName)},</p>
               <p>A new booking has been placed at <strong>{Esc(venueName)}</strong> by <strong>{Esc(customerName)}</strong>.</p>
               {BookingBox(refNo, facilityName, activityName, date, start, end, 1, "Pending")}");

        // ── Booking Confirmed ─────────────────────────────────────────────────

        public static string BookingConfirmed(
            string customerName, string venueName, string facilityName,
            string activityName, DateTime date, DateTime start, DateTime end,
            int participants, string refNo) => Wrap(
            "Booking Confirmed",
            $@"<h2>Your booking is confirmed!</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Great news! Your booking at <strong>{Esc(venueName)}</strong> has been confirmed by the organizer.</p>
               {BookingBox(refNo, facilityName, activityName, date, start, end, participants, "Confirmed")}
               <p>We look forward to seeing you!</p>");

        // ── Booking Rejected ──────────────────────────────────────────────────

        public static string BookingRejected(
            string customerName, string venueName, string facilityName,
            DateTime date, DateTime start, DateTime end,
            string refNo, string reason) => Wrap(
            "Booking Update",
            $@"<h2>Booking not confirmed</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Unfortunately your booking at <strong>{Esc(venueName)}</strong> could not be confirmed.</p>
               {BookingBox(refNo, facilityName, "", date, start, end, 1, "Rejected")}
               {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p><strong>Reason:</strong> {Esc(reason)}</p>")}
               <p>Please contact us if you have any questions or would like to rebook.</p>");

        // ── Booking Cancelled ─────────────────────────────────────────────────

        public static string BookingCancelledCustomer(
            string customerName, string venueName, string facilityName,
            DateTime date, DateTime start, DateTime end, string refNo) => Wrap(
            "Booking Cancelled",
            $@"<h2>Booking cancelled</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Your booking at <strong>{Esc(venueName)}</strong> has been cancelled.</p>
               {BookingBox(refNo, facilityName, "", date, start, end, 1, "Cancelled")}
               <p>If you didn't request this cancellation, please contact us immediately.</p>");

        public static string BookingCancelledOrganizer(
            string organizerName, string customerName, string facilityName,
            DateTime date, DateTime start, DateTime end, string refNo) => Wrap(
            "Booking Cancelled",
            $@"<h2>Booking cancellation</h2>
               <p>Hi {Esc(organizerName)},</p>
               <p>The booking by <strong>{Esc(customerName)}</strong> has been cancelled.</p>
               {BookingBox(refNo, facilityName, "", date, start, end, 1, "Cancelled")}");

        // ── Complaint Created ─────────────────────────────────────────────────

        public static string ComplaintCreatedCustomer(
            string customerName, string title, string refNo) => Wrap(
            "Complaint Received",
            $@"<h2>We've received your complaint</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Your complaint has been logged and our team will review it shortly.</p>
               <div class=""box"">
                 <div class=""row""><span class=""label"">Reference</span><span class=""value"">#{Esc(refNo)}</span></div>
                 <div class=""row""><span class=""label"">Subject</span><span class=""value"">{Esc(title)}</span></div>
                 <div class=""row""><span class=""label"">Status</span><span class=""value"">Open</span></div>
               </div>
               <p>We aim to respond within 2 business days.</p>");

        public static string ComplaintStatusChanged(
            string customerName, string title, string newStatus, string refNo) => Wrap(
            "Complaint Update",
            $@"<h2>Your complaint has been updated</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>There's been an update to your complaint.</p>
               <div class=""box"">
                 <div class=""row""><span class=""label"">Reference</span><span class=""value"">#{Esc(refNo)}</span></div>
                 <div class=""row""><span class=""label"">Subject</span><span class=""value"">{Esc(title)}</span></div>
                 <div class=""row""><span class=""label"">New Status</span><span class=""value"">{Esc(newStatus)}</span></div>
               </div>");

        // ── Welcome emails ────────────────────────────────────────────────────

        public static string WelcomeCustomer(string customerName, string loginUrl) => Wrap(
            "Welcome to NexBook",
            $@"<h2>Welcome to NexBook!</h2>
               <p>Hi {Esc(customerName)},</p>
               <p>Your account has been created. You can now browse venues, book facilities, and manage your bookings.</p>
               <a href=""{loginUrl}"" class=""btn"">Log In Now</a>
               <p style=""margin-top:20px;font-size:13px;color:#666;"">If you didn't create this account, please ignore this email.</p>");

        public static string WelcomeOrganizer(
            string organizerName, string venueName, string loginUrl, string tempPassword) => Wrap(
            "You've been assigned as a Venue Organizer",
            $@"<h2>Welcome, Venue Organizer!</h2>
               <p>Hi {Esc(organizerName)},</p>
               <p>You have been assigned as the organizer for <strong>{Esc(venueName)}</strong>.</p>
               <div class=""box"">
                 <div class=""row""><span class=""label"">Venue</span><span class=""value"">{Esc(venueName)}</span></div>
                 <div class=""row""><span class=""label"">Login URL</span><span class=""value"">{Esc(loginUrl)}</span></div>
                 <div class=""row""><span class=""label"">Temp Password</span><span class=""value"">{Esc(tempPassword)}</span></div>
               </div>
               <p>Please log in and change your password immediately.</p>
               <a href=""{loginUrl}"" class=""btn"">Access Your Portal</a>");

        public static string WelcomeAdmin(
            string adminName, string tenantName, string loginUrl, string tempPassword) => Wrap(
            $"Welcome to NexBook — {tenantName}",
            $@"<h2>Welcome to NexBook!</h2>
               <p>Hi {Esc(adminName)},</p>
               <p>Your tenant workspace for <strong>{Esc(tenantName)}</strong> has been set up.</p>
               <div class=""box"">
                 <div class=""row""><span class=""label"">Login URL</span><span class=""value"">{Esc(loginUrl)}</span></div>
                 <div class=""row""><span class=""label"">Email</span><span class=""value"">{Esc(adminName)}</span></div>
                 <div class=""row""><span class=""label"">Temp Password</span><span class=""value"">{Esc(tempPassword)}</span></div>
               </div>
               <p>Please log in and change your password immediately.</p>
               <a href=""{loginUrl}"" class=""btn"">Go to Dashboard</a>");

        // ── Shared helpers ────────────────────────────────────────────────────

        private static string BookingBox(
            string refNo, string facility, string activity,
            DateTime date, DateTime start, DateTime end,
            int participants, string status) =>
            $@"<div class=""box"">
                 <div class=""row""><span class=""label"">Reference</span><span class=""value"">#{Esc(refNo)}</span></div>
                 <div class=""row""><span class=""label"">Facility</span><span class=""value"">{Esc(facility)}</span></div>
                 {(string.IsNullOrWhiteSpace(activity) ? "" :
                   $"<div class=\"row\"><span class=\"label\">Activity</span><span class=\"value\">{Esc(activity)}</span></div>")}
                 <div class=""row""><span class=""label"">Date</span><span class=""value"">{date:dddd, d MMMM yyyy}</span></div>
                 <div class=""row""><span class=""label"">Time</span><span class=""value"">{start:HH:mm} – {end:HH:mm}</span></div>
                 {(participants > 1 ? $"<div class=\"row\"><span class=\"label\">Participants</span><span class=\"value\">{participants}</span></div>" : "")}
                 <div class=""row""><span class=""label"">Status</span>
                   <span class=""badge badge-{status.ToLower()}"">{Esc(status)}</span>
                 </div>
               </div>";

        /// <summary>Simple HTML entity escaping to prevent injection in email bodies.</summary>
        private static string Esc(string? value) =>
            System.Net.WebUtility.HtmlEncode(value ?? string.Empty);
    }
}
