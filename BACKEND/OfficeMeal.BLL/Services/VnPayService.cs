using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public class VnPayService : IVnPayService
{
    private readonly IConfiguration _config;
    private readonly string _tmnCode;
    private readonly string _hashSecret;
    private readonly string _baseUrl;
    private readonly string _command;
    private readonly string _currCode;
    private readonly string _version;
    private readonly string _locale;
    private readonly string _timeZoneId;

    public VnPayService(IConfiguration config)
    {
        _config = config;
        _tmnCode = _config["Vnpay:TmnCode"] ?? throw new InvalidOperationException("Vnpay:TmnCode missing");
        _hashSecret = _config["Vnpay:HashSecret"] ?? throw new InvalidOperationException("Vnpay:HashSecret missing");
        _baseUrl = _config["Vnpay:BaseUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        _command = _config["Vnpay:Command"] ?? "pay";
        _currCode = _config["Vnpay:CurrCode"] ?? "VND";
        _version = _config["Vnpay:Version"] ?? "2.1.0";
        _locale = _config["Vnpay:Locale"] ?? "vn";
        _timeZoneId = _config["TimeZoneId"] ?? "SE Asia Standard Time";
    }

    public Task<string> CreatePaymentUrlAsync(PaymentInformationModel info)
    {
        var createDate = GetVietnamNow().ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
        var txnRef = info.OrderId > 0
            ? info.OrderId.ToString(CultureInfo.InvariantCulture)
            : Guid.NewGuid().ToString("N")[..12];

        var vnpayData = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = _version,
            ["vnp_Command"] = _command,
            ["vnp_TmnCode"] = _tmnCode,
            ["vnp_Amount"] = ((long)Math.Round(info.Amount * 100m, 0, MidpointRounding.AwayFromZero)).ToString(CultureInfo.InvariantCulture),
            ["vnp_CreateDate"] = createDate,
            ["vnp_CurrCode"] = _currCode,
            ["vnp_IpnUrl"] = ResolveIpnUrl(info),
            ["vnp_Locale"] = _locale,
            ["vnp_OrderInfo"] = string.IsNullOrWhiteSpace(info.OrderDescription) ? "Thanh toan OfficeMeal" : info.OrderDescription.Trim(),
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = ResolveReturnUrl(info),
            ["vnp_TxnRef"] = txnRef
        };

        var signData = BuildSignedQueryString(vnpayData);
        vnpayData["vnp_SecureHash"] = HmacSha512Hex(_hashSecret, signData);

        var query = string.Join("&", vnpayData.Select(kvp =>
            $"{WebUtility.UrlEncode(kvp.Key)}={WebUtility.UrlEncode(kvp.Value)}"));

        return Task.FromResult(_baseUrl + "?" + query);
    }

    public Task<PaymentResponseModel?> VerifyPaymentAsync(string queryString)
    {
        if (string.IsNullOrWhiteSpace(queryString))
        {
            return Task.FromResult<PaymentResponseModel?>(null);
        }

        var trimmed = queryString.Trim().TrimStart('?');
        var queryParams = QueryHelpers.ParseQuery(trimmed);
        if (!queryParams.TryGetValue("vnp_SecureHash", out var hashValues))
        {
            return Task.FromResult<PaymentResponseModel?>(null);
        }

        var inputHash = hashValues.ToString();
        if (string.IsNullOrEmpty(inputHash))
        {
            return Task.FromResult<PaymentResponseModel?>(null);
        }

        var signPairs = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var kv in queryParams)
        {
            var key = kv.Key;
            if (string.IsNullOrEmpty(key))
            {
                continue;
            }

            if (string.Equals(key, "vnp_SecureHash", StringComparison.OrdinalIgnoreCase)
                || string.Equals(key, "vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var value = kv.Value.ToString();
            if (string.IsNullOrEmpty(value))
            {
                continue;
            }

            signPairs[key] = value;
        }

        var signData = BuildSignedQueryString(signPairs);
        var calcHash = HmacSha512Hex(_hashSecret, signData);
        if (!string.Equals(inputHash, calcHash, StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult<PaymentResponseModel?>(null);
        }

        var responseCode = queryParams.TryGetValue("vnp_ResponseCode", out var rc) ? rc.ToString() : string.Empty;
        var success = responseCode == "00";
        var amount = queryParams.TryGetValue("vnp_Amount", out var amt) ? TryParseVnpAmount(amt.ToString()) : 0m;

        var model = new PaymentResponseModel
        {
            TxnRef = queryParams.TryGetValue("vnp_TxnRef", out var tr) ? tr.ToString() : string.Empty,
            OrderDescription = queryParams.TryGetValue("vnp_OrderInfo", out var oi) ? oi.ToString() : string.Empty,
            TransactionNo = queryParams.TryGetValue("vnp_TransactionNo", out var tn) ? tn.ToString() : string.Empty,
            PayMethod = queryParams.TryGetValue("vnp_PayMethod", out var pm) ? pm.ToString() : string.Empty,
            BankCode = queryParams.TryGetValue("vnp_BankCode", out var bc) ? bc.ToString() : string.Empty,
            Success = success,
            SecureHash = inputHash,
            ResponseCode = responseCode,
            Amount = amount,
            PayDate = queryParams.TryGetValue("vnp_PayDate", out var pd) ? pd.ToString() : string.Empty,
            BankTranNo = queryParams.TryGetValue("vnp_BankTranNo", out var btn) && !string.IsNullOrWhiteSpace(btn.ToString())
                ? btn.ToString()
                : null,
            TransactionStatus = queryParams.TryGetValue("vnp_TransactionStatus", out var ts) && !string.IsNullOrWhiteSpace(ts.ToString())
                ? ts.ToString()
                : null
        };

        return Task.FromResult<PaymentResponseModel?>(model);
    }

    private DateTime GetVietnamNow()
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(_timeZoneId);
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
        catch (TimeZoneNotFoundException)
        {
            return DateTime.UtcNow.AddHours(7);
        }
        catch (InvalidTimeZoneException)
        {
            return DateTime.UtcNow.AddHours(7);
        }
    }

    private string ResolveReturnUrl(PaymentInformationModel info)
    {
        if (!string.IsNullOrWhiteSpace(info.ReturnUrl))
        {
            return info.ReturnUrl.Trim();
        }

        return _config["Vnpay:BackendReturnUrl"]
            ?? throw new InvalidOperationException("Configure Vnpay:BackendReturnUrl or set ReturnUrl on PaymentInformationModel.");
    }

    private string ResolveIpnUrl(PaymentInformationModel info)
    {
        if (!string.IsNullOrWhiteSpace(info.IpnUrl))
        {
            return info.IpnUrl.Trim();
        }

        return _config["Vnpay:IpnUrl"]
            ?? throw new InvalidOperationException("Configure Vnpay:IpnUrl or set IpnUrl on PaymentInformationModel.");
    }

    /// <summary>
    /// Chuỗi ký VNPay: các cặp key=value (key đã sort), key/value được url-encode giống mẫu PHP urlencode.
    /// </summary>
    private static string BuildSignedQueryString(IEnumerable<KeyValuePair<string, string>> data)
    {
        return string.Join("&", data.Select(kv =>
            $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));
    }

    private static string HmacSha512Hex(string key, string inputData)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using var hmac = new HMACSHA512(keyBytes);
        var hash = hmac.ComputeHash(inputBytes);
        var sb = new StringBuilder(hash.Length * 2);
        foreach (var b in hash)
        {
            sb.Append(b.ToString("x2"));
        }

        return sb.ToString();
    }

    private static decimal TryParseVnpAmount(string? vnpAmount)
    {
        if (long.TryParse(vnpAmount, NumberStyles.Integer, CultureInfo.InvariantCulture, out var cents))
        {
            return cents / 100m;
        }

        return 0m;
    }
}
