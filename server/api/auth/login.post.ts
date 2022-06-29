import * as z from 'zod'

const bodySchema = z.object({
  email: z.string().min(1, "must not be empty").email("must be a valid email"),
  password: z.string().min(1, "must not be empty")
})

export default defineEventHandler(async (event) => {
  const body = await useBody(event)

  const result = await bodySchema.safeParseAsync(body)
  if (!result.success) {
    event.res.statusCode = 400
    return {
      issues: result.error.issues
    }
  }
})
