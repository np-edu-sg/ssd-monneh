import * as jose from 'jose'
import { defineNuxtRouteMiddleware, useCookie, useRuntimeConfig } from '#imports'

/**
 * Middleware to ensure user is authenticated before accessing route
 *
 * On the server, this checks if the request contains a valid JWT
 * On the client, this should check a local store
 *
 * Since the page is using server rendering, it skips client checking for now
 */
export default defineNuxtRouteMiddleware(async () => {
  if (process.client)
    return

  const { jwtSecret, jwtCookieName } = useRuntimeConfig()
  const cookie = useCookie(jwtCookieName)
  try {
    await jose.jwtVerify(cookie.value, Buffer.from(jwtSecret, 'utf-8'))
    return true
  }
  catch {
    return '/'
  }
})
