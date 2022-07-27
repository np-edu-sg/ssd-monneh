import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import {
    Anchor,
    Avatar,
    Badge,
    Breadcrumbs,
    Button,
    Group,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core'
import type { ThrownResponse } from '@remix-run/react'
import { useLoaderData, useParams } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { useFormattedCurrency } from '~/hooks/formatter'

interface LoaderData {
    transaction: {
        approved: boolean
        notes: string
        entryDateTime: string
        spendDateTime: string
        transactionValue: number
        creator: {
            username: string
            firstName: string
            lastName: string
        }
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
    invariant(params.walletId, 'Expected params.walletId')

    const transactionId = parseInt(params.transactionId)
    const walletId = parseInt(params.walletId)
    const transaction = await db.transaction.findUnique({
        where: {
            id_walletId: {
                id: transactionId,
                walletId,
            },
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
            creator: {
                select: {
                    username: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    })
    if (!transaction) {
        throw json('Transaction does not exist', { status: 404 })
    }

    return json<LoaderData>({
        transaction: {
            ...transaction,
            spendDateTime: transaction.spendDateTime.toISOString(),
            entryDateTime: transaction.spendDateTime.toISOString(),
            transactionValue: transaction.transactionValue.toNumber(),
        },
    })
}

export default function TransactionPage() {
    const { transactionId, organizationId, walletId } = useParams()
    const data = useLoaderData<LoaderData>()

    const transactionValue = useFormattedCurrency(
        data.transaction.transactionValue
    )

    return (
        <div>
            <Breadcrumbs>
                <Anchor href={`/dashboard/organizations/${organizationId}`}>
                    {data.transaction.wallet.organization.name}
                </Anchor>
                <Anchor
                    href={`/dashboard/organizations/${organizationId}/wallets/${walletId}`}
                >
                    {data.transaction.wallet.name}
                </Anchor>
                <Text>{transactionId}</Text>
            </Breadcrumbs>

            <br />

            <Badge
                size={'md'}
                color={data.transaction.approved ? 'green' : 'red'}
            >
                {data.transaction.approved ? 'Approved' : 'Pending approval'}
            </Badge>

            <br />
            <br />

            <SimpleGrid cols={2} breakpoints={[{ cols: 1, maxWidth: 'md' }]}>
                <Stack spacing={'md'} align={'start'}>
                    <Text size={'xl'} weight={600}>
                        {transactionValue}
                    </Text>

                    {!data.transaction.approved && (
                        <Button variant={'outline'} color={'green'}>
                            Approve
                        </Button>
                    )}
                </Stack>

                <Stack spacing={'md'}>
                    <div>
                        <Text size={'sm'} color={'dimmed'}>
                            Notes
                        </Text>
                        {data.transaction.notes.length > 0 ? (
                            <Text>{data.transaction.notes}</Text>
                        ) : (
                            <Text>No notes here</Text>
                        )}
                    </div>

                    <div>
                        <Text size={'sm'} color={'dimmed'} mb={'sm'}>
                            Filed by
                        </Text>
                        <Group>
                            <Avatar color={'violet'} size={'sm'}>
                                {data.transaction.creator.username[0]}
                            </Avatar>
                            <Text>
                                {data.transaction.creator.firstName}{' '}
                                {data.transaction.creator.lastName}
                            </Text>
                        </Group>
                    </div>
                </Stack>
            </SimpleGrid>
        </div>
    )
}
