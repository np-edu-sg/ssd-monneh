import {scrypt, randomBytes} from "node:crypto";
import * as z from 'zod'

const bodySchema = z.object({
  name: z.string().min(1, "must not be empty"),
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

  const hash = await new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(result.data.password, salt, 32, (err, derivedKey) => {
      if (err) {
        reject(err)
      } else {
        resolve(derivedKey.toString('hex') + ":" + salt)
      }
    })
  })

  return {
    hash
  }
})
