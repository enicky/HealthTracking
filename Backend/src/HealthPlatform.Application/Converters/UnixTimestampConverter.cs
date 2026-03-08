using System.Text.Json;
using System.Text.Json.Serialization;

namespace HealthPlatform.Application.Converters;

public class UnixTimestampConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            // Handle both seconds and milliseconds
            if (reader.TryGetDouble(out double unixTimestamp))
            {
                // If timestamp is greater than year 5138 in seconds notation (100 billion),
                // it's definitely in milliseconds. This handles modern timestamps correctly.
                if (unixTimestamp > 100000000000)
                {
                    // Convert from milliseconds to seconds
                    unixTimestamp /= 1000;
                }

                var dateTime = UnixEpoch.AddSeconds(unixTimestamp);
                // Ensure the DateTime is marked as UTC for PostgreSQL compatibility
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }

            throw new JsonException($"Unable to convert \"{reader.GetDouble()}\" to DateTime");
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            if (DateTime.TryParse(reader.GetString(), out var dateTime))
            {
                // Ensure the DateTime is marked as UTC for PostgreSQL compatibility
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }

            throw new JsonException($"Unable to convert \"{reader.GetString()}\" to DateTime");
        }

        throw new JsonException($"Unexpected token {reader.TokenType} when parsing DateTime");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var unixTimestamp = value.Subtract(UnixEpoch).TotalSeconds;
        writer.WriteNumberValue(unixTimestamp);
    }

    private static readonly DateTime UnixEpoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
}
