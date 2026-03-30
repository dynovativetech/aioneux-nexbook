using System.Security.Cryptography;

namespace BookingPlatform.Api.Services
{
    /// <summary>PBKDF2-SHA512 password hashing — uses only BCL, no extra packages.</summary>
    public static class PasswordHelper
    {
        private const int Iterations = 350_000;
        private const int HashSize   = 64;
        private const int SaltSize   = 16;

        public static string Hash(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password, salt, Iterations, HashAlgorithmName.SHA512, HashSize);
            return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
        }

        public static bool Verify(string password, string stored)
        {
            var parts = stored.Split(':');
            if (parts.Length != 2) return false;

            var salt = Convert.FromBase64String(parts[0]);
            var hash = Convert.FromBase64String(parts[1]);

            var test = Rfc2898DeriveBytes.Pbkdf2(
                password, salt, Iterations, HashAlgorithmName.SHA512, HashSize);

            return CryptographicOperations.FixedTimeEquals(hash, test);
        }
    }
}
