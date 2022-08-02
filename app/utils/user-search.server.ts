import * as z from 'zod'

export const userSearchSchema = z.string().min(1).max(64)
