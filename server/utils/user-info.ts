import type { CompatibilityEvent } from 'h3'
import { useCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { verifyJWT } from '~/server/utils/jwt'

export async function useUserInfo(event: CompatibilityEvent) {
  const { jwtCookieName } = useRuntimeConfig()
  const cookie = useCookie(event, jwtCookieName)
  if (!cookie)
    return

  try {
    return await verifyJWT(cookie)
  }
  catch {
  }
}
