import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { Anchor, Breadcrumbs, Text } from '@mantine/core'
import type { ThrownResponse } from '@remix-run/react'
import { useLoaderData, useParams } from '@remix-run/react'
import { db } from '~/utils/db.server'

interface LoaderData {
    transaction: {
        wallet: {
            name: string
            organization: {
                name: string
            }
        }
    }
}

type TransactionNotFoundError = ThrownResponse<404, string>
type ThrownResponses = TransactionNotFoundError

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')

    const { username } = await requireUser(request)
    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(username, organizationId, () => true)

    invariant(params.transactionId, 'Expected params.transactionId')

    const transactionId = parseInt(params.transactionId)
    const transaction = await db.transaction.findUnique({
        where: {
            id: transactionId,
        },
        include: {
            wallet: {
                select: {
                    name: true,
                    organization: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    })
    if (!transaction) {
        throw json('Transaction does not exist', { status: 404 })
    }

    return json<LoaderData>({ transaction })
}

export default function TransactionPage() {
    const { transactionId, organizationId, walletId } = useParams()
    const data = useLoaderData<LoaderData>()

    return (
        <div>
            <Breadcrumbs>
                <Anchor href={`/dashboard/organizations/${organizationId}`}>
                    {data.transaction.wallet.organization.name}
                </Anchor>
                <Anchor href={`/dashboard/organizations/${walletId}`}>
                    {data.transaction.wallet.name}
                </Anchor>
                <Text>{transactionId}</Text>
            </Breadcrumbs>
        </div>
    )
}
