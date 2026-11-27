using Kijk.Application.Spaces.Shared;
using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Validates new invitations.
/// </summary>
public sealed class CreateSpaceInvitationRequestValidator : AbstractValidator<CreateSpaceInvitationRequest>
{
    /// <summary>The longest e-mail address SMTP allows.</summary>
    private const int MaxEmailLength = 254;

    /// <summary>
    /// Creates the invitation validator.
    /// </summary>
    public CreateSpaceInvitationRequestValidator()
    {
        RuleFor(request => request.RoleId)
            .Must(roleId => roleId is null || roleId == SpaceRoles.Member.Id || roleId == SpaceRoles.Viewer.Id)
            .WithMessage("Invitations can only grant the Member or Viewer role")
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request)
            .Must(request => string.IsNullOrWhiteSpace(request.UniqueName) != string.IsNullOrWhiteSpace(request.Email))
            .WithName(nameof(CreateSpaceInvitationRequest.UniqueName))
            .WithMessage("Invite either by unique name or by e-mail address")
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.UniqueName)
            .Must(name => UniqueName.TryParse(name, out _, out _))
            .When(request => !string.IsNullOrWhiteSpace(request.UniqueName))
            .WithMessage("A unique name looks like Max#4821")
            .WithErrorCode(ErrorCodes.ValidationError);

        RuleFor(request => request.Email)
            .MaximumLength(MaxEmailLength)
            .EmailAddress()
            .When(request => !string.IsNullOrWhiteSpace(request.Email))
            .WithErrorCode(ErrorCodes.ValidationError);
    }
}