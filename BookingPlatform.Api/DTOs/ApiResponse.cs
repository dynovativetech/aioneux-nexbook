namespace BookingPlatform.Api.DTOs
{
    /// <summary>
    /// Typed error category used by controllers to choose the correct HTTP status code
    /// without brittle string-matching on the human-readable message.
    /// </summary>
    public enum ApiErrorKind
    {
        /// <summary>Input failed business-rule or format validation.</summary>
        Validation,

        /// <summary>The requested resource does not exist.</summary>
        NotFound,

        /// <summary>The operation conflicts with existing data (e.g. double-booking).</summary>
        Conflict,

        /// <summary>The caller is not permitted to perform the operation.</summary>
        Forbidden,
    }

    public class ApiResponse<T>
    {
        public bool         Success   { get; set; }
        public string       Message   { get; set; } = string.Empty;
        public T?           Data      { get; set; }
        public List<string>? Errors   { get; set; }

        /// <summary>
        /// Populated on failure to let controllers map to the right HTTP status code
        /// without parsing the human-readable <see cref="Message"/> string.
        /// </summary>
        public ApiErrorKind? ErrorKind { get; set; }

        // ── Success factory ──────────────────────────────────────────────────
        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new() { Success = true, Message = message, Data = data };

        // ── Failure factories ────────────────────────────────────────────────

        /// <summary>General validation or business-rule failure (maps to 400).</summary>
        public static ApiResponse<T> Fail(
            string message,
            List<string>? errors   = null,
            ApiErrorKind  errorKind = ApiErrorKind.Validation) =>
            new() { Success = false, Message = message, Errors = errors, ErrorKind = errorKind };

        /// <summary>The requested entity was not found (maps to 404).</summary>
        public static ApiResponse<T> NotFound(string message) =>
            Fail(message, errorKind: ApiErrorKind.NotFound);

        /// <summary>A scheduling or data conflict was detected (maps to 409).</summary>
        public static ApiResponse<T> Conflict(string message, List<string>? errors = null) =>
            Fail(message, errors, ApiErrorKind.Conflict);

        /// <summary>The caller does not have permission (maps to 403).</summary>
        public static ApiResponse<T> Forbidden(string message) =>
            Fail(message, errorKind: ApiErrorKind.Forbidden);
    }
}
