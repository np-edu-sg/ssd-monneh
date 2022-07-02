import {createError, setCookie} from "h3";

import * as z from 'zod'
import prisma from '~/prisma/client'
import {randomBytes, scrypt} from "node:crypto";
import * as jose from "jose";

const bodySchema = z.object({
  email: z.string().min(1, "must not be empty").email("must be a valid email"),
  password: z.string().min(1, "must not be empty")
})

export default defineEventHandler(async (event) => {
  const body = await useBody(event)

  const result = await bodySchema.safeParseAsync(body)
  if (!result.success) {
    return createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      data: {
        issues: result.error.issues
      }
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      email: result.data.email
    }
  })

  if (!user) {
    return createError({
      statusCode: 400,
      statusMessage: 'Could not sign in'
    })
  }

  const passwordValid = await new Promise<boolean>((resolve, reject) => {
    const [hash, salt] = user.passwordHash.split(":")
    scrypt(result.data.password, salt, 32, (err, derivedKey) => {
      if (err) {
        reject(err)
      } else {
        resolve(hash === derivedKey.toString('hex'))
      }
    })
  })

  if (!passwordValid) {
    return createError({
      statusCode: 400,
      statusMessage: 'Could not sign in'
    })
  }

  const {firstName, lastName, email, id} = user
  const {jwtSecret, jwtIssuer, jwtExpirationTime, jwtCookieName} = useRuntimeConfig()
  const jwt = await new jose.SignJWT({firstName, lastName, email, id})
    .setProtectedHeader({alg: 'HS512'})
    .setIssuedAt()
    .setIssuer(jwtIssuer)
    .setExpirationTime(jwtExpirationTime)
    .sign(Buffer.from(jwtSecret, 'utf-8'))

  setCookie(event, jwtCookieName, jwt, {httpOnly: true})

  event.res.statusCode = 204
  return null
})
