/**
 * There is a lot of ternary
 *
 * I'm sorry
 *
 * Please forgive me Javascript people from above
 */

import type { ActionFunction, LoaderFunction } from '@remix-run/node'
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
import { NavLink, useLoaderData, useParams, useSubmit } from '@remix-run/react'
import { db } from '~/utils/db.server'
import { useFormattedCurrency } from '~/hooks/formatter'
import { TransactionState } from '@prisma/client'
import { useMemo } from 'react'
import * as z from 'zod'
import { getValidationErrorObject } from '~/utils/validation.server'
import { audit } from '~/utils/audit.server'

interface LoaderData {
    username: string
    transaction: {
        notes: string
        state: TransactionState
        entryDateTime: string
        spendDateTime: string
        transactionValue: number
        reviewer: {
            username: string
            firstName: string
            lastName: string
        }
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
            reviewer: {
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
        username,
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

interface ActionData {
    errors: Record<string, string>
}

const approveTransactionBodySchema = z.object({
    state: z
        .nativeEnum(TransactionState)
        .refine((v) => v !== TransactionState.Pending),
})

export const action: ActionFunction = async ({ request, params }) => {
    invariant(params.organizationId)
    invariant(params.walletId)
    invariant(params.transactionId)
    const { username } = await requireUser(request)

    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowApproveTransactions
    )

    const formData = await request.formData()
    const walletId = parseInt(params.walletId)
    const transactionId = parseInt(params.transactionId)

    const result = await approveTransactionBodySchema.safeParseAsync({
        state: formData.get('state'),
    })

    if (!result.success) {
        return json<ActionData>({
            errors: getValidationErrorObject(result.error.issues),
        })
    }

    const transaction = await db.transaction.findUnique({
        where: {
            id_walletId: {
                id: transactionId,
                walletId,
            },
        },
        include: {
            wallet: true,
        },
    })

    invariant(transaction, 'Expected transaction')

    // Approving or rejecting a transaction is permanent
    if (transaction.state !== TransactionState.Pending) {
        return json<ActionData>({
            errors: {
                state: 'Transaction state has already been set',
            },
        })
    }

    const balanceAfter =
        transaction.wallet.balance.toNumber() +
        transaction.transactionValue.toNumber()
    if (result.data.state === TransactionState.Approved && balanceAfter < 0) {
        return json<ActionData>({
            errors: {
                '': 'Wallet does not have enough balance to approve this transaction',
            },
        })
    }

    await db.$transaction(async (prisma) => {
        await prisma.transaction.update({
            where: {
                id_walletId: {
                    id: transactionId,
                    walletId,
                },
            },
            data: {
                state: result.data.state,
            },
        })

        await audit(
            username,
            organizationId,
            'transaction',
            transactionId,
            result.data.state === TransactionState.Approved
                ? 'approve'
                : 'reject',
            `Transaction was ${result.data.state}`
        )

        if (result.data.state === TransactionState.Approved) {
            const { balance } = await prisma.wallet.update({
                where: {
                    id: walletId,
                },
                data: {
                    balance: {
                        increment: transaction.transactionValue,
                    },
                },
            })
            await audit(
                username,
                organizationId,
                'wallet',
                walletId,
                'update',
                `Wallet balance was incremented by ${transaction.transactionValue} to ${balance}`
            )
        }
    })

    return json({})
}

export default function TransactionPage() {
    const submit = useSubmit()
    const data = useLoaderData<LoaderData>()
    const { transactionId, organizationId, walletId } = useParams()

    const transactionValue = useFormattedCurrency(
        data.transaction.transactionValue
    )

    const hasEnoughBalance = useMemo(
        () =>
            data.transaction.wallet.balance +
                data.transaction.transactionValue >=
            0,
        [data]
    )
    const hasPermission = useMemo(
        () => data.transaction.reviewer.username === data.username,
        [data]
    )

    const spendDateTime = useMemo(() => {
        return new Date(data.transaction.spendDateTime).toLocaleDateString()
    }, [data])

    const entryDateTime = useMemo(() => {
        return new Date(data.transaction.entryDateTime).toLocaleDateString()
    }, [data])

    const approve = () =>
        submit({ state: TransactionState.Approved }, { method: 'post' })
    const reject = () =>
        submit({ state: TransactionState.Rejected }, { method: 'post' })

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

            <Group>
                <Text size={'lg'} weight={600}>
                    #{transactionId}
                </Text>

                <Badge
                    size={'lg'}
                    color={
                        data.transaction.state === TransactionState.Pending
                            ? 'gray'
                            : data.transaction.state ===
                              TransactionState.Approved
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
            </Group>

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

                    <Group position={'apart'} align={'center'}>
                        <Text size={'sm'} color={'dimmed'} mb={'sm'}>
                            Reviewer
                        </Text>
                        <Group>
                            <Avatar color={'green'} size={'sm'}>
                                {data.transaction.reviewer.username[0]}
                            </Avatar>
                            <Text>
                                {data.transaction.reviewer.firstName}{' '}
                                {data.transaction.reviewer.lastName}
                            </Text>
                        </Group>
                    </Group>

                    <Group position={'apart'} align={'center'}>
                        <Text size={'sm'} color={'dimmed'} mb={'sm'}>
                            Spent on
                        </Text>
                        <Group>
                            <Text>{spendDateTime}</Text>
                        </Group>
                    </Group>

                    <Group position={'apart'} align={'center'}>
                        <Text size={'sm'} color={'dimmed'} mb={'sm'}>
                            Created on
                        </Text>
                        <Group>
                            <Text color={'dimmed'}>{entryDateTime}</Text>
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

                <div>
                    <Card
                        p={'lg'}
                        sx={(theme) => ({
                            borderStyle: 'solid',
                            borderWidth: 1,
                            /**
                             * Javascript abomination below:
                             *
                             * Approved: green
                             * Rejected: red
                             * Pending:
                             *  Has permission & enough balance: green
                             *  Else: red
                             */
                            borderColor: {
                                [TransactionState.Approved]: theme.colors.green,
                                [TransactionState.Rejected]: theme.colors.red,
                                [TransactionState.Pending]:
                                    hasPermission && hasEnoughBalance
                                        ? theme.colors.green
                                        : theme.colors.red,
                            }[data.transaction.state][
                                theme.colorScheme === 'dark' ? 9 : 4
                            ],
                        })}
                    >
                        {
                            {
                                [TransactionState.Approved]: (
                                    <Text
                                        color={'green'}
                                        mb={'sm'}
                                        weight={600}
                                    >
                                        Transaction was approved!
                                    </Text>
                                ),
                                [TransactionState.Rejected]: (
                                    <Text color={'red'} mb={'sm'} weight={600}>
                                        Transaction was rejected!
                                    </Text>
                                ),
                                [TransactionState.Pending]: (
                                    <Stack>
                                        {hasPermission ? (
                                            hasEnoughBalance ? (
                                                <>
                                                    <Text
                                                        color={'green'}
                                                        mb={'sm'}
                                                        weight={600}
                                                    >
                                                        This transaction is good
                                                        to go!
                                                    </Text>
                                                    <Group>
                                                        <Button
                                                            color={'red'}
                                                            variant={'subtle'}
                                                            onClick={reject}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            color={'green'}
                                                            onClick={approve}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </Group>
                                                </>
                                            ) : (
                                                <>
                                                    <Text
                                                        color={'red'}
                                                        mb={'sm'}
                                                        weight={600}
                                                    >
                                                        This transaction cannot
                                                        be approved
                                                    </Text>
                                                    <Button
                                                        color={'red'}
                                                        onClick={reject}
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        component={NavLink}
                                                        to={'./new'}
                                                        color={'grape'}
                                                        variant={'subtle'}
                                                    >
                                                        Add more funds
                                                    </Button>
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <Text
                                                    color={'red'}
                                                    mb={'sm'}
                                                    weight={600}
                                                >
                                                    You do not have permission
                                                    to approve this transaction
                                                </Text>
                                                <Text color={'red'} mb={'sm'}>
                                                    You must be the reviewer to
                                                    approve this transaction
                                                </Text>
                                            </>
                                        )}
                                    </Stack>
                                ),
                            }[data.transaction.state]
                        }
                    </Card>
                </div>
            </SimpleGrid>
        </div>
    )
}
