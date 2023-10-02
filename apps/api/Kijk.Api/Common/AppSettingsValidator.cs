using Kijk.Api.Common.Models;

namespace Kijk.Api.Common;

public class AppSettingsValidator : AbstractValidator<AppSettings>
{
    public AppSettingsValidator()
    {
        RuleFor(x => x.ConnectionStrings.DefaultConnection).NotEmpty();
        
        RuleFor(x => x.Auth.Scopes).NotEmpty();
        RuleFor(x => x.Auth.ClientId).NotEmpty();
        RuleFor(x => x.Auth.Instance).NotEmpty();
    }
}
