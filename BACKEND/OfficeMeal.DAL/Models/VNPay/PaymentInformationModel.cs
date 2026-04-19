namespace OfficeMeal.DAL.Models;

/// <summary>
/// Tham số tạo URL thanh toán VNPay, gắn với <see cref="Order"/> đang ở trạng thái chờ thanh toán.
/// </summary>
public class PaymentInformationModel
{
    /// <summary>Trùng <see cref="Order.Id"/>; gửi sang VNPay dưới dạng vnp_TxnRef.</summary>
    public int OrderId { get; set; }

    /// <summary>Số tiền (VND), cùng nghĩa với <see cref="Order.TotalAmount"/>.</summary>
    public decimal Amount { get; set; }

    /// <summary>Nội dung hiển thị trên cổng VNPay (vnp_OrderInfo).</summary>
    public string OrderDescription { get; set; } = string.Empty;

    /// <summary>Tên khách — thường lấy từ <see cref="User.FullName"/>.</summary>
    public string CustomerFullName { get; set; } = string.Empty;

    /// <summary>URL backend nhận redirect; để null hoặc rỗng thì dùng cấu hình Vnpay:BackendReturnUrl.</summary>
    public string? ReturnUrl { get; set; }

    /// <summary>URL IPN; để null hoặc rỗng thì dùng cấu hình Vnpay:IpnUrl.</summary>
    public string? IpnUrl { get; set; }
}
