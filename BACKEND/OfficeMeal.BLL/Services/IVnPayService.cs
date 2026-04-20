using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public interface IVnPayService
{
    Task<string> CreatePaymentUrlAsync(PaymentInformationModel info);
    Task<PaymentResponseModel?> VerifyPaymentAsync(string queryString);
}
