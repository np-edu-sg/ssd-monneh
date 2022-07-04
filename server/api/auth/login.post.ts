import { scrypt } from 'node:crypto'
import { createError, defineEventHandler, setCookie, useBody } from 'h3'

import * as z from 'zod'
import * as jose from 'jose'
import { useRuntimeConfig } from '#imports'
import { ERROR_BAD_REQUEST, ERROR_LOGIN_FAILED, createErrorResponse, usePrisma } from '~/server/utils'

const bodySchema = z.object({
  email: z.string().min(1, 'must not be empty').email('must be a valid email'),
  password: z.string().min(1, 'must not be empty'),
})

export default defineEventHandler(async (event) => {
  const prisma = await usePrisma()
  const body = await useBody(event)

  const result = await bodySchema.safeParseAsync(body)
  if (!result.success)
    return createErrorResponse(event, ERROR_BAD_REQUEST, result.error.issues)

  // Check if user exists
  const user = await prisma.user.findFirst({
    where: {
      email: result.data.email,
    },
  })

  if (!user)
    return createErrorResponse(event, ERROR_LOGIN_FAILED)

  // Compare salt
  const passwordValid = await new Promise<boolean>((resolve, reject) => {
    const [hash, salt] = user.passwordHash.split(':')
    scrypt(result.data.password, salt, 32, (err, derivedKey) => {
      if (err)
        reject(err)
      else
        resolve(hash === derivedKey.toString('hex'))
    })
  })

  if (!passwordValid)
    return createErrorResponse(event, ERROR_LOGIN_FAILED)

  // Generate JWT
  const { firstName, lastName, email, id } = user
  const { jwtSecret, jwtIssuer, jwtExpirationTime, jwtCookieName } = useRuntimeConfig()
  const jwt = await new jose.SignJWT({ firstName, lastName, email, id })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setIssuer(jwtIssuer)
    .setExpirationTime(jwtExpirationTime)
    .setSubject(id.toString())
    .sign(Buffer.from(jwtSecret, 'utf-8'))

  setCookie(event, jwtCookieName, jwt, { httpOnly: true })

  // We don't have any content to return for now
  event.res.statusCode = 204
  return null
})
