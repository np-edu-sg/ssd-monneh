import { defineEventHandler } from 'h3'
import { ERROR_UNAUTHORIZED, createErrorResponse, usePrisma, useUserInfo } from '~/server/utils'

export default defineEventHandler(async (event) => {
  const user = await useUserInfo(event)
  if (!user)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  const prisma = await usePrisma()

  return await prisma.$transaction(async (prisma) => {
    const organization = prisma.organization.create({
      data: {
        name: 'ACME Organization',
        wallets: {
          create: [
            {
              name: 'International Cash Funds',
              balance: 10028.93,
            },
          ],
        },
        users: {
          connect: {
            id: parseInt(user.payload.sub!, 10),
          },
        },
      },
    })

    return organization
  })
})
