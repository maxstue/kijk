---
name: conventional-commits
description: Enforce Conventional Commits v1.0.0 for git commit tasks, including committing, staging and committing, amending, or writing commit messages.
---

# Conventional Commits

## Core Rule

Create, suggest, amend, and review commit messages using the Conventional Commits v1.0.0 format. Apply this skill whenever the user asks to commit, create a commit, stage and commit, save changes, write or suggest a commit message, amend a commit message, review staged changes for commit readiness, or perform any git commit-related task.

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Never add `Co-Authored-By`, copyright, model attribution, or AI attribution footers.

## Commit Workflow

1. Inspect the staged diff before writing a commit message:
   - Prefer `git diff --cached --stat` for scope.
   - Use `git diff --cached` or focused file diffs when the type or description is not obvious.
2. Choose the primary type:
   - `fix`: bug fix
   - `feat`: new functionality
   - `docs`: documentation only
   - `test`: tests only
   - `perf`: performance improvement
   - `refactor`: code restructuring without feature or bug-fix intent
   - `style`: formatting-only change
   - `build`: build tooling or dependencies
   - `ci`: CI configuration
   - `chore`: everything else
   - `revert`: revert of an earlier commit
3. Add a lowercase scope when it clarifies the affected area, such as an app, package, module, route, or feature name.
4. Write the description in imperative present tense.
5. Add a body only when the motivation or behavior change is not obvious from the subject.
6. Add footers only for breaking changes, issue references, reviewers, or other valid trailers.
7. Re-read the complete message before committing and verify every rule below.

## Subject Rules

- Format as `<type>[optional scope]: <description>`.
- Keep the full first line at or under 72 characters.
- Use only the allowed lowercase types listed above.
- Keep scopes lowercase.
- Start the description lowercase.
- Use imperative present tense: `add`, `fix`, `remove`, `update`.
- Do not end the description with punctuation.
- Describe what changed, not implementation mechanics.
- Avoid vague subjects such as `update code`, `fix stuff`, or `misc changes`.

## Body And Footers

- Separate subject, body, and footer blocks with one blank line.
- Wrap body and footer lines at 72 characters when practical.
- Use the body to explain why the change exists and how behavior differs from before.
- Use git trailer format for footers, such as `Refs: #123` or `Reviewed-by: Z`.
- Write `BREAKING CHANGE:` exactly with a space and uppercase words when using that footer.

## Breaking Changes

Mark breaking changes with either or both of:

```text
feat(api)!: change pagination response format

BREAKING CHANGE: pagination response structure has changed
```

Any commit type can be breaking by adding `!` before the colon or a `BREAKING CHANGE:` footer.

## Examples

```text
feat(auth): add email validation to signup form
```

```text
fix(api): resolve token expiration race condition
```

```text
refactor(parser): simplify ast node creation

Replace the factory pattern with direct constructor calls. The factory
added indirection without meaningful abstraction.
```

```text
revert: restore previous release workflow

Refs: 676104e
```
