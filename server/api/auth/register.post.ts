import { randomBytes, scrypt } from 'node:crypto'
import { createError, defineEventHandler, setCookie, useBody } from 'h3'

import * as z from 'zod'
import * as jose from 'jose'
import { useRuntimeConfig } from '#imports'
import { ERROR_BAD_REQUEST, ERROR_EMAIL_CONFLICT, createErrorResponse, usePrisma } from '~/server/utils'

const bodySchema = z.object({
  firstName: z.string().min(1, 'must not be empty'),
  lastName: z.string().min(1, 'must not be empty'),
  email: z.string().min(1, 'must not be empty').email('must be a valid email'),
  password: z.string().min(1, 'must not be empty'),
})

export default defineEventHandler(async (event) => {
  const prisma = await usePrisma()
  const body = await useBody(event)

  const result = await bodySchema.safeParseAsync(body)
  if (!result.success)
    return createErrorResponse(event, ERROR_BAD_REQUEST, result.error.issues)

  const passwordHash = await new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(result.data.password, salt, 32, (err, derivedKey) => {
      if (err)
        reject(err)
      else
        resolve(`${derivedKey.toString('hex')}:${salt}`)
    })
  })

  const { firstName, lastName, email } = result.data
  let user = await prisma.user.findFirst({
    where: {
      email,
    },
  })
  if (user)
    return createErrorResponse(event, ERROR_EMAIL_CONFLICT)

  user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
    },
  })

  const { jwtSecret, jwtIssuer, jwtExpirationTime, jwtCookieName } = useRuntimeConfig()
  const jwt = await new jose.SignJWT({ firstName, lastName, email, id: user.id })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setIssuer(jwtIssuer)
    .setExpirationTime(jwtExpirationTime)
    .sign(Buffer.from(jwtSecret, 'utf-8'))

  setCookie(event, jwtCookieName, jwt, { httpOnly: true })

  event.res.statusCode = 204
  return null
})
