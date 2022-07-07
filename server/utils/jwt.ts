import * as jose from 'jose'
import type { JWTPayload } from 'jose'
import { useRuntimeConfig } from '#imports'

export interface UserJWTPayload {
  id: number
  email: string
  firstName: string
  lastName: string
}

export type DecodedJWTPayload = JWTPayload & UserJWTPayload

export async function createJWT(payload: UserJWTPayload): Promise<string> {
  const { firstName, lastName, email, id } = payload
  const { jwtSecret, jwtIssuer, jwtExpirationTime } = useRuntimeConfig()
  return await new jose.SignJWT({ firstName, lastName, email, id })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setIssuer(jwtIssuer)
    .setExpirationTime(jwtExpirationTime)
    .sign(Buffer.from(jwtSecret, 'utf-8'))
}

export async function verifyJWT(token: string): Promise<DecodedJWTPayload> {
  const { jwtSecret, jwtIssuer } = useRuntimeConfig()
  const { payload } = await jose.jwtVerify(token, Buffer.from(jwtSecret, 'utf-8'), {
    issuer: jwtIssuer,
  })

  return payload as DecodedJWTPayload
}
