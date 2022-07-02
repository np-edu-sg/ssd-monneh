import {createError} from "h3";
import * as jose from 'jose'

export default defineEventHandler(async (event) => {
  const cookies = useCookies(event)

  const {jwtCookieName, jwtSecret} = useRuntimeConfig()
  if (!cookies[jwtCookieName]) {
    return createError({
      statusCode: 403,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const {payload} = await jose.jwtVerify(cookies[jwtCookieName], Buffer.from(jwtSecret,'utf-8'))
    return payload
  } catch (err) {
    return createError({
      statusCode: 403,
      statusMessage: 'Unauthorized'
    })
  }
})
