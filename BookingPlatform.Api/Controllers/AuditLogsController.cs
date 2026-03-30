using BookingPlatform.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Returns audit logs, newest first.
        /// Optional filters: entityType, action, actorEmail, fromDate, toDate.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? entityType = null,
            [FromQuery] string? action     = null,
            [FromQuery] string? actor      = null,
            [FromQuery] DateTime? from     = null,
            [FromQuery] DateTime? to       = null,
            [FromQuery] int page           = 1,
            [FromQuery] int pageSize       = 50)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityType))
                query = query.Where(l => l.EntityType == entityType);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrWhiteSpace(actor))
                query = query.Where(l =>
                    l.ActorEmail.Contains(actor) ||
                    l.ActorName.Contains(actor));

            if (from.HasValue)
                query = query.Where(l => l.Timestamp >= from.Value.ToUniversalTime());

            if (to.HasValue)
                query = query.Where(l => l.Timestamp <= to.Value.ToUniversalTime().AddDays(1));

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.Timestamp,
                    l.Action,
                    l.EntityType,
                    l.EntityId,
                    l.EntityName,
                    l.Details,
                    l.ActorId,
                    l.ActorEmail,
                    l.ActorName,
                    l.IpAddress,
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data = logs });
        }

        /// <summary>Returns the audit history for a specific entity.</summary>
        [HttpGet("{entityType}/{entityId}")]
        public async Task<IActionResult> GetForEntity(string entityType, int entityId)
        {
            var logs = await _context.AuditLogs
                .Where(l => l.EntityType == entityType && l.EntityId == entityId)
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new
                {
                    l.Id, l.Timestamp, l.Action, l.Details, l.ActorEmail, l.ActorName,
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
