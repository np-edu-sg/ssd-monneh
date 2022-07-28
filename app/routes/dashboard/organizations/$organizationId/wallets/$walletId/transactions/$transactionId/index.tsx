/**
 * There is a lot of ternary
 *
 * I'm sorry
 *
 * Please forgive me Javascript people from above
 */

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
    Card,
    Group,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core'
import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useLoaderData, useParams } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { useFormattedCurrency } from '~/hooks/formatter'
import { TransactionState } from '@prisma/client'

interface LoaderData {
    transaction: {
        notes: string
        state: TransactionState
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
            balance: number
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
                    balance: true,
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
            wallet: {
                ...transaction.wallet,
                balance: transaction.wallet.balance.toNumber(),
            },
        },
    })
}

export default function TransactionPage() {
    const { transactionId, organizationId, walletId } = useParams()
    const data = useLoaderData<LoaderData>()

    const transactionValue = useFormattedCurrency(
        data.transaction.transactionValue
    )

    const approvable =
        data.transaction.wallet.balance >= data.transaction.transactionValue

    return (
        <div>
            <Breadcrumbs>
                <Anchor
                    component={NavLink}
                    to={`/dashboard/organizations/${organizationId}`}
                >
                    {data.transaction.wallet.organization.name}
                </Anchor>
                <Anchor
                    component={NavLink}
                    to={`/dashboard/organizations/${organizationId}/wallets/${walletId}`}
                >
                    {data.transaction.wallet.name}
                </Anchor>
                <Text>{transactionId}</Text>
            </Breadcrumbs>

            <br />

            <Badge
                size={'lg'}
                color={
                    data.transaction.state === TransactionState.Pending
                        ? 'gray'
                        : data.transaction.state === TransactionState.Approved
                        ? 'green'
                        : 'red'
                }
            >
                {data.transaction.state === TransactionState.Pending
                    ? 'Pending approval'
                    : data.transaction.state === TransactionState.Approved
                    ? 'Approved'
                    : 'Rejected'}
            </Badge>

            <SimpleGrid
                cols={2}
                breakpoints={[{ cols: 1, maxWidth: 'md' }]}
                mt={'md'}
                mb={'xl'}
                spacing={50}
            >
                <Stack spacing={'md'}>
                    <Group position={'apart'} align={'center'}>
                        <Text size={'sm'} color={'dimmed'}>
                            Transaction amount
                        </Text>
                        <Text size={'xl'} weight={600}>
                            {transactionValue}
                        </Text>
                    </Group>

                    <Group position={'apart'} align={'center'}>
                        <Text size={'sm'} color={'dimmed'} mb={'sm'}>
                            Created by
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
                    </Group>

                    <div>
                        <Text size={'sm'} color={'dimmed'}>
                            Notes
                        </Text>
                        {data.transaction.notes.length > 0 ? (
                            <Text>{data.transaction.notes}</Text>
                        ) : (
                            <Text color={'dark'}>No notes yet...</Text>
                        )}
                    </div>
                </Stack>

                <Card
                    p={'lg'}
                    sx={(theme) => ({
                        borderStyle: 'solid',
                        borderWidth: 1,
                        borderColor:
                            theme.colorScheme === 'dark'
                                ? theme.colors.green[9]
                                : theme.colors.green[4],
                    })}
                >
                    {
                        {
                            [TransactionState.Approved]: (
                                <Text color={'green'}>
                                    Transaction was approved!
                                </Text>
                            ),
                            [TransactionState.Rejected]: (
                                <Text color={'red'}>
                                    Transaction was rejected!
                                </Text>
                            ),
                            [TransactionState.Pending]: (
                                <Stack>
                                    {approvable ? (
                                        <>
                                            <Text
                                                color={'green'}
                                                mb={'sm'}
                                                weight={600}
                                            >
                                                This transaction is good to go!
                                            </Text>
                                            <Button color={'green'}>
                                                Approve
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Text
                                                color={'red'}
                                                mb={'sm'}
                                                weight={600}
                                            >
                                                You do not have enough balance
                                                to approve this transaction!
                                            </Text>
                                            <Button color={'red'}>
                                                Reject
                                            </Button>
                                            <Button
                                                color={'grape'}
                                                variant={'subtle'}
                                            >
                                                Add more funds
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            ),
                        }[data.transaction.state]
                    }
                </Card>
            </SimpleGrid>
        </div>
    )
}
