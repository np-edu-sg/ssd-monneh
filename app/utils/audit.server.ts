import { db } from '~/utils/db.server'
import type { Prisma } from '@prisma/client'

export async function audit(
    username: string,
    organizationId: number,
    objectType: 'organization' | 'wallet' | 'transaction',
    objectId: number,
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject',
    message: string,
    factory?: (prisma: Prisma.TransactionClient) => Promise<unknown>
) {
    if (!factory) {
        return await db.audit.create({
            data: {
                timestamp: new Date(),
                subject: username,
                action,
                objectType,
                objectId,
                message,
                organization: {
                    connect: {
                        id: organizationId,
                    },
                },
            },
        })
    }

    return db.$transaction(async (prisma) => {
        const result = await factory(prisma)
        await db.audit.create({
            data: {
                timestamp: new Date(),
                subject: username,
                action,
                objectType,
                objectId,
                message,
                organization: {
                    connect: {
                        id: organizationId,
                    },
                },
            },
        })
        return result
    })
}
