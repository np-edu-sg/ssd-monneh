import type { ZodIssue } from 'zod'

export function getValidationErrorObject(
    issues: ZodIssue[]
): Record<string, string> {
    return issues.reduce<Record<string, string>>((a, v) => {
        a[v.path.toString()] = v.message
        return a
    }, {})
}
