import { createError, defineEventHandler } from 'h3'
import * as jose from 'jose'
import { useRuntimeConfig } from '#imports'
import { ERROR_UNAUTHORIZED, createErrorResponse } from '~/server/utils'

/**
 * Endpoint to let SPAs know if the user is authenticated
 */
export default defineEventHandler(async (event) => {
  const cookies = useCookies(event)

  const { jwtCookieName, jwtSecret } = useRuntimeConfig()
  if (!cookies[jwtCookieName])
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  try {
    const { payload } = await jose.jwtVerify(cookies[jwtCookieName], Buffer.from(jwtSecret, 'utf-8'))
    return payload
  }
  catch (err) {
    return createErrorResponse(event, ERROR_UNAUTHORIZED)
  }
})
