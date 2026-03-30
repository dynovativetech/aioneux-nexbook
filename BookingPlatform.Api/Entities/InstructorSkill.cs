namespace BookingPlatform.Api.Entities
{
    /// <summary>
    /// Maps an Instructor to an Activity they are qualified to teach.
    /// Uses a composite primary key (InstructorId, ActivityId).
    ///
    /// Qualification logic in BookingService:
    ///   - If an instructor has NO rows in InstructorSkill, they are treated as
    ///     universally qualified (backward-compatible with seed data that predates
    ///     this table).
    ///   - If an instructor HAS at least one row, the chosen activity MUST match
    ///     one of those rows, otherwise the booking is rejected.
    /// </summary>
    public class InstructorSkill
    {
        public int InstructorId { get; set; }
        public Instructor? Instructor { get; set; }

        public int ActivityId { get; set; }
        public Activity? Activity { get; set; }

        /// <summary>Proficiency level on a 1–5 scale (null = not formally rated).</summary>
        public int? ProficiencyLevel { get; set; }

        /// <summary>Free-text certification note (e.g. "Level 3 CIMSPA certified").</summary>
        public string? CertificationNote { get; set; }
    }
}
