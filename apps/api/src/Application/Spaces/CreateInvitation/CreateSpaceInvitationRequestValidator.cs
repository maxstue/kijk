using Kijk.Domain.Authorization;
using Kijk.Shared;

namespace Kijk.Application.Spaces.CreateInvitation;

/// <summary>
/// Validates new invitations.
/// </summary>
public sealed class CreateSpaceInvitationRequestValidator : AbstractValidator<CreateSpaceInvitationRequest>
{
    /// <summary>
    /// Creates the invitation validator.
    /// </summary>
    public CreateSpaceInvitationRequestValidator()
    {
        RuleFor(request => request.RoleId)
            .Must(roleId => roleId is null || roleId == SpaceRoles.Member.Id || roleId == SpaceRoles.Viewer.Id)
            .WithMessage("Invitations can only grant the Member or Viewer role")
            .WithErrorCode(ErrorCodes.ValidationError);
    }
}