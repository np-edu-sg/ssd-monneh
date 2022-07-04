import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
export function usePrisma() {
  if (!prisma)
    prisma = new PrismaClient()
  return prisma
}
