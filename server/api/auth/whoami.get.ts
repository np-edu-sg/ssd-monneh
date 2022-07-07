import { defineEventHandler, useCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { ERROR_UNAUTHORIZED, createErrorResponse } from '~/server/utils'
import { verifyJWT } from '~/server/utils/jwt'

/**
 * Endpoint to let SPAs know if the user is authenticated
 */
export default defineEventHandler(async (event) => {
  const { jwtCookieName } = useRuntimeConfig()
  const cookie = useCookie(event, jwtCookieName)
  if (!cookie)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  try {
    return await verifyJWT(cookie)
  }
  catch (err) {
    return createErrorResponse(event, ERROR_UNAUTHORIZED)
  }
})
