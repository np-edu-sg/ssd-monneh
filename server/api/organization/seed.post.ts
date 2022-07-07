import { defineEventHandler } from 'h3'
import { ERROR_UNAUTHORIZED, createErrorResponse, useCasbin, usePrisma, useUserInfo } from '~/server/utils'

export default defineEventHandler(async (event) => {
  const user = await useUserInfo(event)
  if (!user)
    return createErrorResponse(event, ERROR_UNAUTHORIZED)

  const prisma = await usePrisma()
  const casbin = await useCasbin()

  return await prisma.$transaction(async (prisma) => {
    const organization = await prisma.organization.create({
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
            id: user.id,
          },
        },
      },
    })

    await casbin.addPolicy(user.id.toString(), organization.id.toString(), 'wallet', 'allow')

    return organization
  })
})
