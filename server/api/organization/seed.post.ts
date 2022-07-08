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

    await Promise.all([
      casbin.addPolicy('root', organization.id.toString(), 'wallet', 'read'),
      casbin.addPolicy('root', organization.id.toString(), 'wallet', 'write'),
      casbin.addPolicy('root', organization.id.toString(), 'wallet', 'delete'),
      casbin.addPolicy('root', organization.id.toString(), 'transaction', 'read'),
      casbin.addPolicy('root', organization.id.toString(), 'transaction', 'write'),
      casbin.addPolicy('root', organization.id.toString(), 'transaction', 'delete'),
      casbin.addGroupingPolicy(user.id.toString(), 'root', organization.id.toString()),
    ])

    return organization
  })
})
