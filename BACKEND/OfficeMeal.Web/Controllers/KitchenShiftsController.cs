using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using System.Data;
using System.Data.Common;
using System.Security.Claims;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/kitchen-shifts")]
[Authorize]
public class KitchenShiftsController : ControllerBase
{
    private readonly OfficeMealContext _dbContext;
    private const int KitchenManagerRoleId = 2;

    public KitchenShiftsController(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("me/status")]
    [Authorize(Roles = "KitchenManager,Admin")]
    public async Task<IActionResult> GetMyShiftStatus()
    {
        var userIdRaw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        if (!string.Equals(role, "KitchenManager", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = DateTime.Now,
                IsAssignedToday = false,
                IsActive = true,
                CanOperate = true,
                Message = "Tài khoản quản trị không bị giới hạn theo ca."
            });
        }

        var now = DateTime.Now;
        var today = now.Date;

        await using var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        var hasWorkDate = await HasColumnAsync(conn, "KitchenShiftAssignments", "WorkDate");
        if (!hasWorkDate)
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = now,
                IsAssignedToday = false,
                IsActive = false,
                CanOperate = false,
                Message = "Thiếu cột WorkDate trong bảng KitchenShiftAssignments."
            });
        }

        var rows = new List<KitchenShiftRowVm>();
        var intIdOk = int.TryParse(userIdRaw, out var userIdInt);
        if (intIdOk)
        {
            rows = await QueryRowsByUserIdAsync(conn, today, userIdInt);
        }
        else
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = now,
                IsAssignedToday = false,
                IsActive = false,
                CanOperate = false,
                Message = "Không tìm thấy cấu hình phân ca phù hợp với tài khoản hiện tại."
            });
        }

        if (rows.Count == 0)
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = now,
                IsAssignedToday = false,
                IsActive = false,
                CanOperate = false,
                Message = "Bạn chưa được phân ca hôm nay."
            });
        }

        KitchenShiftRowVm? active = null;
        KitchenShiftRowVm? next = null;
        foreach (var row in rows)
        {
            var startAt = row.StartAt;
            var endAt = row.EndAt;
            if (now >= startAt && now < endAt)
            {
                active = row;
                break;
            }

            if (now < startAt)
            {
                next = row;
                break;
            }
        }

        if (active is not null)
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = now,
                IsAssignedToday = true,
                IsActive = true,
                CanOperate = true,
                CurrentShiftName = active.ShiftName,
                CurrentShiftStartAt = active.StartAt,
                CurrentShiftEndAt = active.EndAt,
                SecondsUntilShiftEnd = Math.Max(0, (int)Math.Floor((active.EndAt - now).TotalSeconds)),
                Message = $"Đang Trong Ca: {active.ShiftName}"
            });
        }

        if (next is not null)
        {
            return Ok(new KitchenShiftStatusVm
            {
                ServerTime = now,
                IsAssignedToday = true,
                IsActive = false,
                CanOperate = false,
                NextShiftName = next.ShiftName,
                NextShiftStartAt = next.StartAt,
                NextShiftEndAt = next.EndAt,
                SecondsUntilNextShift = Math.Max(0, (int)Math.Floor((next.StartAt - now).TotalSeconds)),
                Message = $"Bạn Đang Inactive. Ca Kế Tiếp: {next.ShiftName}"
            });
        }

        return Ok(new KitchenShiftStatusVm
        {
            ServerTime = now,
            IsAssignedToday = true,
            IsActive = false,
            CanOperate = false,
            Message = "Bạn đã hết ca hôm nay."
        });
    }

    [HttpGet("admin/options")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminShiftOptions()
    {
        var today = DateTime.Now.Date;
        await using var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        var shift1Id = await EnsureShiftAsync(conn, "Ca 1", "07:00:00", "14:00:00");
        var shift2Id = await EnsureShiftAsync(conn, "Ca 2", "14:00:00", "21:00:00");

        int? user1 = await GetAssignedUserIdAsync(conn, today, shift1Id);
        int? user2 = await GetAssignedUserIdAsync(conn, today, shift2Id);

        var kitchenUsers = await _dbContext.Users
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.RoleId == KitchenManagerRoleId)
            .Select(x => new KitchenUserVm
            {
                Id = x.Id,
                FullName = x.FullName
            })
            .OrderBy(x => x.FullName)
            .ToListAsync();

        return Ok(new
        {
            WorkDate = today,
            Shift1UserId = user1,
            Shift2UserId = user2,
            KitchenUsers = kitchenUsers
        });
    }

    [HttpPut("admin/today-assignments")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SaveTodayAssignments([FromBody] SaveTodayAssignmentsVm model)
    {
        var today = DateTime.Now.Date;
        if (model is null)
        {
            return BadRequest(new { message = "Dữ liệu phân ca không hợp lệ." });
        }

        if (model.Shift1UserId.HasValue && model.Shift2UserId.HasValue && model.Shift1UserId == model.Shift2UserId)
        {
            return BadRequest(new { message = "Không thể gán cùng một tài khoản cho cả 2 ca." });
        }

        var assignedIds = new[] { model.Shift1UserId, model.Shift2UserId }
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();

        if (assignedIds.Count > 0)
        {
            var validCount = await _dbContext.Users
                .CountAsync(x =>
                    assignedIds.Contains(x.Id) &&
                    x.IsActive &&
                    x.RoleId == KitchenManagerRoleId);

            if (validCount != assignedIds.Count)
            {
                return BadRequest(new { message = "Có tài khoản không hợp lệ hoặc không phải KitchenManager." });
            }
        }

        await using var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        var shift1Id = await EnsureShiftAsync(conn, "Ca 1", "07:00:00", "14:00:00");
        var shift2Id = await EnsureShiftAsync(conn, "Ca 2", "14:00:00", "21:00:00");

        await SaveOneShiftAssignmentAsync(conn, today, shift1Id, model.Shift1UserId);
        await SaveOneShiftAssignmentAsync(conn, today, shift2Id, model.Shift2UserId);

        return Ok(new { message = "Lưu phân ca hôm nay thành công." });
    }

    private static async Task<bool> HasColumnAsync(DbConnection conn, string table, string column)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT 1
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = @TableName AND c.name = @ColumnName;";
        cmd.Parameters.Add(new SqlParameter("@TableName", SqlDbType.NVarChar, 128) { Value = table });
        cmd.Parameters.Add(new SqlParameter("@ColumnName", SqlDbType.NVarChar, 128) { Value = column });
        var result = await cmd.ExecuteScalarAsync();
        return result is not null;
    }

    private static async Task<int> EnsureShiftAsync(DbConnection conn, string shiftName, string startTime, string endTime)
    {
        await using var findCmd = conn.CreateCommand();
        findCmd.CommandText = @"
SELECT TOP 1 Id
FROM KitchenShifts
WHERE ShiftName = @ShiftName;";
        findCmd.Parameters.Add(new SqlParameter("@ShiftName", SqlDbType.NVarChar, 50) { Value = shiftName });
        var found = await findCmd.ExecuteScalarAsync();
        if (found is not null && found != DBNull.Value)
        {
            var existingId = Convert.ToInt32(found);
            await using var updateCmd = conn.CreateCommand();
            updateCmd.CommandText = @"
UPDATE KitchenShifts
SET StartTime = @StartTime, EndTime = @EndTime
WHERE Id = @Id;";
            updateCmd.Parameters.Add(new SqlParameter("@StartTime", SqlDbType.Time) { Value = TimeSpan.Parse(startTime) });
            updateCmd.Parameters.Add(new SqlParameter("@EndTime", SqlDbType.Time) { Value = TimeSpan.Parse(endTime) });
            updateCmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = existingId });
            await updateCmd.ExecuteNonQueryAsync();
            return existingId;
        }

        await using var insertCmd = conn.CreateCommand();
        insertCmd.CommandText = @"
INSERT INTO KitchenShifts(ShiftName, StartTime, EndTime)
VALUES (@ShiftName, @StartTime, @EndTime);
SELECT CAST(SCOPE_IDENTITY() AS INT);";
        insertCmd.Parameters.Add(new SqlParameter("@StartTime", SqlDbType.Time) { Value = TimeSpan.Parse(startTime) });
        insertCmd.Parameters.Add(new SqlParameter("@EndTime", SqlDbType.Time) { Value = TimeSpan.Parse(endTime) });
        insertCmd.Parameters.Add(new SqlParameter("@ShiftName", SqlDbType.NVarChar, 50) { Value = shiftName });
        var id = await insertCmd.ExecuteScalarAsync();
        return Convert.ToInt32(id);
    }

    private static async Task<int?> GetAssignedUserIdAsync(
        DbConnection conn,
        DateTime workDate,
        int shiftId)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT TOP 1 UserId
FROM KitchenShiftAssignments
WHERE WorkDate = @WorkDate
  AND ShiftId = @ShiftId
ORDER BY Id DESC;";
        cmd.Parameters.Add(new SqlParameter("@WorkDate", SqlDbType.Date) { Value = workDate });
        cmd.Parameters.Add(new SqlParameter("@ShiftId", SqlDbType.Int) { Value = shiftId });
        var result = await cmd.ExecuteScalarAsync();
        if (result is null || result == DBNull.Value)
        {
            return null;
        }

        return Convert.ToInt32(result);
    }

    /// <summary>KitchenShiftAssignments.Id là INT IDENTITY — chỉ chèn UserId, ShiftId, WorkDate.</summary>
    private static async Task SaveOneShiftAssignmentAsync(
        DbConnection conn,
        DateTime workDate,
        int shiftId,
        int? userId)
    {
        await using var cleanupCmd = conn.CreateCommand();
        cleanupCmd.CommandText = @"
DELETE FROM KitchenShiftAssignments
WHERE WorkDate = @WorkDate
  AND ShiftId = @ShiftId;";
        cleanupCmd.Parameters.Add(new SqlParameter("@WorkDate", SqlDbType.Date) { Value = workDate });
        cleanupCmd.Parameters.Add(new SqlParameter("@ShiftId", SqlDbType.Int) { Value = shiftId });
        await cleanupCmd.ExecuteNonQueryAsync();

        if (!userId.HasValue)
        {
            return;
        }

        await using var insertCmd = conn.CreateCommand();
        insertCmd.CommandText = """
INSERT INTO KitchenShiftAssignments(UserId, ShiftId, WorkDate)
VALUES (@UserId, @ShiftId, @WorkDate);
""";
        insertCmd.Parameters.Add(new SqlParameter("@UserId", SqlDbType.Int) { Value = userId.Value });
        insertCmd.Parameters.Add(new SqlParameter("@ShiftId", SqlDbType.Int) { Value = shiftId });
        insertCmd.Parameters.Add(new SqlParameter("@WorkDate", SqlDbType.Date) { Value = workDate });
        await insertCmd.ExecuteNonQueryAsync();
    }

    private static async Task<List<KitchenShiftRowVm>> QueryRowsByUserIdAsync(
        DbConnection conn,
        DateTime workDate,
        int userId)
    {
        var rows = new List<KitchenShiftRowVm>();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT 
    s.Id AS ShiftId,
    s.ShiftName,
    s.StartTime,
    s.EndTime
FROM KitchenShiftAssignments a
INNER JOIN KitchenShifts s ON s.Id = a.ShiftId
WHERE a.WorkDate = @WorkDate
  AND a.UserId = @UserId
ORDER BY s.StartTime;";
        cmd.Parameters.Add(new SqlParameter("@WorkDate", SqlDbType.Date) { Value = workDate });
        cmd.Parameters.Add(new SqlParameter("@UserId", SqlDbType.Int) { Value = userId });

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var start = (TimeSpan)reader["StartTime"];
            var end = (TimeSpan)reader["EndTime"];
            var date = workDate.Date;
            rows.Add(new KitchenShiftRowVm
            {
                ShiftId = Convert.ToInt32(reader["ShiftId"]),
                ShiftName = Convert.ToString(reader["ShiftName"]) ?? "Ca",
                StartAt = date.Add(start),
                EndAt = date.Add(end)
            });
        }

        return rows;
    }

    private sealed class KitchenShiftRowVm
    {
        public int ShiftId { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
    }

    private sealed class KitchenShiftStatusVm
    {
        public DateTime ServerTime { get; set; }
        public bool IsAssignedToday { get; set; }
        public bool IsActive { get; set; }
        public bool CanOperate { get; set; }
        public string? CurrentShiftName { get; set; }
        public DateTime? CurrentShiftStartAt { get; set; }
        public DateTime? CurrentShiftEndAt { get; set; }
        public int? SecondsUntilShiftEnd { get; set; }
        public string? NextShiftName { get; set; }
        public DateTime? NextShiftStartAt { get; set; }
        public DateTime? NextShiftEndAt { get; set; }
        public int? SecondsUntilNextShift { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public sealed class SaveTodayAssignmentsVm
    {
        public int? Shift1UserId { get; set; }
        public int? Shift2UserId { get; set; }
    }

    private sealed class KitchenUserVm
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
    }
}
