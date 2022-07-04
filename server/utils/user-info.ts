import type { CompatibilityEvent } from 'h3'
import { useCookie } from 'h3'
import * as jose from 'jose'
import { useRuntimeConfig } from '#imports'

export async function useUserInfo(event: CompatibilityEvent) {
  const { jwtSecret, jwtCookieName } = useRuntimeConfig()
  const cookie = useCookie(event, jwtCookieName)
  if (!cookie)
    return

  try {
    return await jose.jwtVerify(cookie, Buffer.from(jwtSecret, 'utf-8'))
  }
  catch {
  }
}
