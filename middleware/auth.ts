import * as jose from 'jose'
import { defineNuxtRouteMiddleware, useCookie, useRuntimeConfig } from '#imports'

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
