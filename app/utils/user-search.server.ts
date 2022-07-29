import * as z from 'zod'

export const userSearchSchema = z
    .string()
    .min(1)
    .max(64)
    .regex(/^[0-9A-Za-z]+$/, 'Search must be alphanumeric')
