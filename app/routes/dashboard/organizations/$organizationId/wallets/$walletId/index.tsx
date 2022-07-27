import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { db } from '~/utils/db.server'
import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useCatch, useLoaderData, useParams } from '@remix-run/react'
import {
    Anchor,
    Breadcrumbs,
    Button,
    Card,
    Center,
    Group,
    Stack,
    Text,
} from '@mantine/core'
import { useFormattedCurrency } from '~/hooks/formatter'
import { Plus } from 'tabler-icons-react'
import { useMemo } from 'react'
import type { TransactionState } from '@prisma/client'

interface LoaderData {
    wallet: {
        name: string
        balance: number
        organization: {
            name: string
        }
        transactions: {
            id: number
            entryDateTime: string
            spendDateTime: string
            transactionValue: number
            notes: string
            state: TransactionState
            creatorUsername: string
            reviewerUsername: string
        }[]
    }
}

type WalletNotFoundError = ThrownResponse<404, string>
type ThrownResponses = WalletNotFoundError

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')
    invariant(params.walletId, 'Expected params.walletId')

    const { username } = await requireUser(request)
    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(username, organizationId, () => true)

    const walletId = parseInt(params.walletId)
    const wallet = await db.wallet.findUnique({
        where: {
            id: walletId,
        },
        include: {
            transactions: {
                take: 10,
            },
            organization: {
                select: {
                    name: true,
                },
            },
        },
    })

    if (!wallet) {
        throw json('Wallet does not exist', { status: 404 })
    }

    const transactions = wallet.transactions.map((value) => ({
        ...value,
        transactionValue: value.transactionValue.toNumber(),
        entryDateTime: value.entryDateTime.toUTCString(),
        spendDateTime: value.spendDateTime.toUTCString(),
    }))

    return json<LoaderData>({
        wallet: {
            ...wallet,
            balance: wallet.balance.toNumber(),
            transactions,
        },
    })
}

interface TransactionCardProps {
    id: number
    entryDateTime: string
    transactionValue: number
}

function TransactionCard({
    id,
    entryDateTime,
    transactionValue,
}: TransactionCardProps) {
    const value = useFormattedCurrency(transactionValue)
    const dateString = useMemo(() => {
        return new Date(entryDateTime).toLocaleDateString()
    }, [entryDateTime])

    return (
        <Card to={`./transactions/${id}`} component={NavLink}>
            <Group position={'apart'}>
                <Text>{dateString}</Text>
                <Text>{value}</Text>
            </Group>
        </Card>
    )
}

export default function WalletPage() {
    const { organizationId } = useParams()
    const data = useLoaderData<LoaderData>()

    return (
        <div>
            <Breadcrumbs>
                <Anchor href={`/dashboard/organizations/${organizationId}`}>
                    {data.wallet.organization.name}
                </Anchor>
                <Text>{data.wallet.name}</Text>
            </Breadcrumbs>

            <br />

            <Group position={'apart'}>
                <Text size={'xl'} weight={600}>
                    Recent transactions
                </Text>

                <Button
                    component={NavLink}
                    to={'./transactions/new'}
                    variant={'outline'}
                >
                    <Plus size={20} />
                </Button>
            </Group>

            <br />

            <Stack spacing={'sm'}>
                {data.wallet.transactions.map((transaction) => (
                    <TransactionCard key={transaction.id} {...transaction} />
                ))}
            </Stack>
        </div>
    )
}

export function CatchBoundary() {
    const error = useCatch<ThrownResponses>()

    return (
        <Center
            component={'section'}
            sx={(theme) => ({
                backgroundColor:
                    theme.colorScheme === 'dark'
                        ? theme.fn.rgba(theme.colors.red[9], 0.5)
                        : theme.colors.red[4],
                height: '100%',
            })}
        >
            <Text weight={600} size={'xl'}>
                {error.status} {error.data}
            </Text>
        </Center>
    )
}
