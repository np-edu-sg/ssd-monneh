import { defineEventHandler, useBody } from 'h3'
import * as z from 'zod'
import {
  ERROR_BAD_REQUEST,
  ERROR_UNAUTHORIZED,
  createErrorResponse,
  usePrisma,
  useUserInfo,
} from '~/server/utils'

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
})

export default defineEventHandler(async (event) => {
  const user = await useUserInfo(event)
  if (!user)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  const result = await paramsSchema.safeParseAsync(event.context.params)
  if (!result.success)
    return createErrorResponse(event, ERROR_BAD_REQUEST, result.error.issues)

  const { id } = result.data
  const prisma = await usePrisma()

  await prisma.$transaction(async (prisma) => {
    await prisma.organization.delete({
      where: {
        id,
      },
    })
  })

  event.res.statusCode = 204
  return null
})
