namespace OfficeMeal.DAL.Models;

/// <summary>
/// Kết quả kiểm tra chữ ký và các tham số vnp_* trả về từ VNPay, dùng để khớp với <see cref="Order"/> và cập nhật trạng thái.
/// </summary>
public class PaymentResponseModel
{
    /// <summary>vnp_TxnRef — với OfficeMeal là <see cref="Order.Id"/> dạng chuỗi.</summary>
    public string TxnRef { get; set; } = string.Empty;

    /// <summary>vnp_OrderInfo.</summary>
    public string OrderDescription { get; set; } = string.Empty;

    /// <summary>vnp_TransactionNo — mã giao dịch tại VNPay (ghi vào <see cref="Order.Note"/>).</summary>
    public string TransactionNo { get; set; } = string.Empty;

    /// <summary>vnp_PayMethod.</summary>
    public string PayMethod { get; set; } = string.Empty;

    /// <summary>vnp_BankCode.</summary>
    public string BankCode { get; set; } = string.Empty;

    /// <summary>true khi vnp_ResponseCode = 00 và chữ ký hợp lệ.</summary>
    public bool Success { get; set; }

    /// <summary>vnp_ResponseCode.</summary>
    public string ResponseCode { get; set; } = string.Empty;

    /// <summary>Số tiền VNPay báo (VND), quy đổi từ vnp_Amount (đơn vị xu).</summary>
    public decimal Amount { get; set; }

    /// <summary>vnp_PayDate (chuỗi yyyyMMddHHmmss từ VNPay).</summary>
    public string PayDate { get; set; } = string.Empty;

    /// <summary>vnp_SecureHash đã dùng để đối chiếu.</summary>
    public string SecureHash { get; set; } = string.Empty;

    /// <summary>vnp_BankTranNo nếu có.</summary>
    public string? BankTranNo { get; set; }

    /// <summary>vnp_TransactionStatus nếu có.</summary>
    public string? TransactionStatus { get; set; }
}
