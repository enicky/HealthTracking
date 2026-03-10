using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthPlatform.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedSuperAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create System tenant if not exists
            migrationBuilder.Sql(@"
                INSERT INTO ""Tenants"" (""Id"", ""Name"", ""CreatedAt"", ""UpdatedAt"")
                VALUES ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'System', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (""Id"") DO NOTHING;
            ");

            // Create or update super admin user with password hash
            // Password: AdminPassword123!
            // SHA256 Hash (Base64): g/zT9xKbCB+usEPcByYuY/6lmdpL5oaaeheA9whKFbQ=
            migrationBuilder.Sql(@"
                INSERT INTO ""Users"" (""Id"", ""TenantId"", ""Email"", ""FirstName"", ""LastName"", ""PasswordHash"", ""Role"", ""CreatedAt"", ""UpdatedAt"", ""DeletedAt"")
                VALUES ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'admin@healthplatform.com', 'System', 'Admin', 'g/zT9xKbCB+usEPcByYuY/6lmdpL5oaaeheA9whKFbQ=', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
                ON CONFLICT (""Id"") DO UPDATE SET ""PasswordHash"" = 'g/zT9xKbCB+usEPcByYuY/6lmdpL5oaaeheA9whKFbQ=', ""Role"" = 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove seed data
            migrationBuilder.Sql(@"
                DELETE FROM ""Users"" WHERE ""Id"" = '550e8400-e29b-41d4-a716-446655440001'::uuid;
                DELETE FROM ""Tenants"" WHERE ""Id"" = '550e8400-e29b-41d4-a716-446655440000'::uuid;
            ");
        }
    }
}



