import { defineEventHandler } from 'h3'
import { ERROR_UNAUTHORIZED, createErrorResponse, useUserInfo } from '~/server/utils'

export default defineEventHandler(async (event) => {
  const user = await useUserInfo(event)
  if (!user)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)
})
