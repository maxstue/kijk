using NetEscapades.EnumGenerators;

namespace Kijk.Api.Common.Models;

[EnumExtensions]
public enum TransactionType
{
    Income,
    Expense,
    Transfer
}

[EnumExtensions]
public enum EnergyConsumptionType
{
    Electricity,
    Gas,
    Water
}

[EnumExtensions]
public enum Role
{
    Admin,
    Member
}

[EnumExtensions]
public enum CategoryType
{
    Expense,
    Income,
    Other
}

[EnumExtensions]
public enum CategoryCreatorType
{
    Default,
    User
}

[EnumExtensions]
public enum Visibility
{
    Public,
    Private
}

[EnumExtensions]
public enum AccountType
{
    Checking,
    Savings,
    CreditCard,
    Cash,
    Loan,
    Investment,
    Other
}

[EnumExtensions]
public enum Frequency
{
    Daily,
    Weekly,
    BiWeekly,
    Monthly,
    Quarterly,
    Yearly
}

[EnumExtensions]
public enum TransactionStatus
{
    Pending,
    Completed,
    Failed
}

[EnumExtensions]
public enum BudgetStatus
{
    Active,
    Completed,
    Pending
}
