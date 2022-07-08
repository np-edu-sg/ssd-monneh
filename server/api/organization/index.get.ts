import { defineEventHandler } from 'h3'
import { ERROR_UNAUTHORIZED, createErrorResponse, useCasbin, usePrisma, useUserInfo } from '~/server/utils'

export default defineEventHandler(async (event) => {
  const user = await useUserInfo(event)
  if (!user)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  const prisma = await usePrisma()
  return await prisma.organization.findMany({
    where: {
      users: {
        every: {
          id: user.id,
        },
      },
    },
  })
})
