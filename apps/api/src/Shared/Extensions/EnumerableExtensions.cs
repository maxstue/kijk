namespace Kijk.Shared.Extensions;

/// <summary>Conditional composition helpers for sequences and queries.</summary>
public static class EnumerableExtensions
{
    /// <summary>Applies the transforms only when <paramref name="should" /> is <see langword="true" />.</summary>
    /// <param name="query">The query.</param>
    /// <param name="should">Whether to apply the transforms.</param>
    /// <param name="transforms">The transforms, applied in order.</param>
    /// <typeparam name="T">The element type.</typeparam>
    /// <returns>The transformed or the original query.</returns>
    public static IQueryable<T> If<T>(this IQueryable<T> query, bool should, params Func<IQueryable<T>, IQueryable<T>>[] transforms) => should
        ? transforms.Aggregate(
            query,
            (current, transform) => transform.Invoke(current))
        : query;

    /// <summary>Applies the transforms only when <paramref name="should" /> is <see langword="true" />.</summary>
    /// <param name="query">The sequence.</param>
    /// <param name="should">Whether to apply the transforms.</param>
    /// <param name="transforms">The transforms, applied in order.</param>
    /// <typeparam name="T">The element type.</typeparam>
    /// <returns>The transformed or the original sequence.</returns>
    public static IEnumerable<T> If<T>(this IEnumerable<T> query, bool should, params Func<IEnumerable<T>, IEnumerable<T>>[] transforms) => should
        ? transforms.Aggregate(
            query,
            (current, transform) => transform.Invoke(current))
        : query;
}