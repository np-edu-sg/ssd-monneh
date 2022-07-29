import type { ThrownResponse } from '@remix-run/react'
import {
    NavLink,
    useCatch,
    useLoaderData,
    useParams,
    useSubmit,
} from '@remix-run/react'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
    ActionIcon,
    Aside,
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Group,
    MediaQuery,
    Menu,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core'
import { db } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { ChevronRight, DoorExit, Settings } from 'tabler-icons-react'
import { useFormattedCurrency } from '~/hooks/formatter'
import { useModals } from '@mantine/modals'
import { Role } from '~/utils/roles'
import { useMemo } from 'react'
import { TransactionCard } from '~/components'
import type { TransactionState } from '@prisma/client'

export const action: ActionFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')

    const { username } = await requireUser(request)

    const organizationId = parseInt(params.organizationId)
    const { role } = await requireAuthorization(
        username,
        organizationId,
        () => true
    )
    if (role === Role.Owner) {
        return json('Owners cannot leave the organization', { status: 400 })
    }

    await db.organizationToUser.delete({
        where: {
            organizationId_username: {
                organizationId,
                username,
            },
        },
    })

    return redirect('/dashboard')
}

interface LoaderData {
    username: string
    canLeaveOrganization: boolean
    transactions: {
        id: number
        entryDateTime: string
        transactionValue: number
        state: TransactionState
        wallet: {
            id: number
        }
        creator: {
            username: string
        }
        reviewer: {
            username: string
        }
    }[]
    organization: {
        id: number
        name: string
        completedSetup: boolean
        wallets: {
            id: number
            name: string
            balance: number
        }[]
        users: {
            role: string
            user: {
                username: string
                firstName: string
                lastName: string
            }
        }[]
    }
}

type OrganizationNotFoundError = ThrownResponse<404, string>
type ThrownResponses = OrganizationNotFoundError

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')
    const { username } = await requireUser(request)

    const id = parseInt(params.organizationId)
    const role = await requireAuthorization(username, id, () => true)

    const organization = await db.organization.findUnique({
        include: {
            wallets: true,
            users: {
                include: {
                    user: {
                        select: {
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
        where: {
            id,
        },
    })

    const transactions = await db.transaction.findMany({
        where: {
            AND: [
                {
                    wallet: {
                        organization: {
                            id,
                        },
                    },
                },
                {
                    OR: [
                        {
                            creator: {
                                username,
                            },
                        },
                        {
                            reviewer: {
                                username,
                            },
                        },
                    ],
                },
            ],
        },
        select: {
            id: true,
            entryDateTime: true,
            transactionValue: true,
            state: true,
            wallet: {
                select: {
                    id: true,
                },
            },
            creator: {
                select: {
                    username: true,
                },
            },
            reviewer: {
                select: {
                    username: true,
                },
            },
        },
    })

    if (!organization)
        throw json('Organization does not exist', { status: 404 })

    if (!organization.completedSetup)
        return redirect(`/dashboard/organizations/${id}/setup`)

    return json<LoaderData>({
        username,
        canLeaveOrganization: role.role !== Role.Owner,
        transactions: transactions.map((t) => ({
            ...t,
            entryDateTime: t.entryDateTime.toISOString(),
            transactionValue: t.transactionValue.toNumber(),
        })),
        organization: {
            ...organization,
            wallets: organization.wallets.map((v) => ({
                ...v,
                balance: v.balance.toNumber(),
            })),
        },
    })
}

interface WalletCardProps {
    id: number
    name: string
    balance: number
}

function WalletCard({ id, name, balance }: WalletCardProps) {
    const { organizationId } = useParams()
    const formattedBalance = useFormattedCurrency(balance)

    invariant(organizationId, 'Expected organizationId')

    return (
        <UnstyledButton
            component={NavLink}
            to={`/dashboard/organizations/${organizationId}/wallets/${id}`}
        >
            <Card p={'md'}>
                <Group position={'apart'}>
                    <Text size={'lg'} weight={600}>
                        {name}
                    </Text>

                    <Group>
                        <Badge size={'lg'} radius={'sm'}>
                            {formattedBalance}
                        </Badge>
                        <ChevronRight />
                    </Group>
                </Group>
            </Card>
        </UnstyledButton>
    )
}

export default function OrganizationPage() {
    const modals = useModals()
    const submit = useSubmit()
    const { organization, canLeaveOrganization, transactions, username } =
        useLoaderData<LoaderData>()

    const openConfirmModal = () =>
        modals.openConfirmModal({
            title: 'Are you sure?',
            centered: true,
            confirmProps: { color: 'red' },
            children: (
                <Text size={'sm'}>
                    Leaving an organization is permanent!
                    <br />
                    <br />
                    <Text color={'red'} weight={600}>
                        You will need to get the organization owner to add you
                        back!
                    </Text>
                </Text>
            ),
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            onConfirm: () => submit(null, { method: 'delete' }),
        })

    const assignedTransactions = useMemo(
        () =>
            transactions.filter(
                ({ reviewer }) => reviewer.username === username
            ),
        [transactions, username]
    )

    const createdTransactions = useMemo(
        () =>
            transactions.filter(({ creator }) => creator.username === username),
        [transactions, username]
    )

    return (
        <div>
            <Stack>
                <Group position={'apart'}>
                    <Text size={'xl'} weight={600}>
                        Wallets
                    </Text>

                    <Group>
                        <Button
                            color={'cyan'}
                            variant={'outline'}
                            component={NavLink}
                            to={`/dashboard/organizations/${organization.id}/wallets/new`}
                        >
                            Add wallet
                        </Button>

                        {canLeaveOrganization && (
                            <Menu>
                                <Menu.Label>Danger zone</Menu.Label>
                                <Menu.Item
                                    color={'red'}
                                    icon={<DoorExit size={14} />}
                                    onClick={openConfirmModal}
                                >
                                    Leave organization
                                </Menu.Item>
                            </Menu>
                        )}
                    </Group>
                </Group>
                {organization.wallets.length === 0 ? (
                    <>
                        <Text>You have no wallets!</Text>
                    </>
                ) : (
                    organization.wallets.map((params) => (
                        <WalletCard {...params} key={params.id} />
                    ))
                )}

                <Text size={'xl'} weight={600}>
                    Reviews assigned to you
                </Text>

                <Stack spacing={'sm'}>
                    {assignedTransactions.length === 0 ? (
                        <Text color={'dimmed'}>No transactions assigned!</Text>
                    ) : (
                        assignedTransactions.map((transaction) => (
                            <TransactionCard
                                key={transaction.id}
                                linkPrefix={`./wallets/${transaction.wallet.id}/transactions`}
                                {...transaction}
                            />
                        ))
                    )}
                </Stack>

                <Text size={'xl'} weight={600}>
                    Your reviews
                </Text>

                <Stack spacing={'sm'}>
                    {createdTransactions.length === 0 ? (
                        <Text color={'dimmed'}>No transactions created!</Text>
                    ) : (
                        createdTransactions.map((transaction) => (
                            <TransactionCard
                                key={transaction.id}
                                linkPrefix={`./wallets/${transaction.wallet.id}/transactions`}
                                {...transaction}
                            />
                        ))
                    )}
                </Stack>
            </Stack>

            <MediaQuery smallerThan={'sm'} styles={{ display: 'none' }}>
                <Aside
                    p={'md'}
                    hiddenBreakpoint={'sm'}
                    width={{ sm: 200, lg: 300 }}
                >
                    <Stack justify={'space-between'} style={{ height: '100%' }}>
                        <Stack spacing={'sm'} justify={'space-between'}>
                            <Text weight={600}>Members</Text>
                            <Stack spacing={'md'}>
                                {organization.users.map(
                                    ({
                                        role,
                                        user: { username, firstName, lastName },
                                    }) => (
                                        <Group key={username}>
                                            <Avatar size={30} color={'blue'}>
                                                {username[0]}
                                            </Avatar>
                                            <Text
                                                component={'span'}
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {firstName} {lastName}
                                            </Text>

                                            <Badge>{role}</Badge>
                                        </Group>
                                    )
                                )}
                            </Stack>
                        </Stack>

                        <ActionIcon component={NavLink} to={'./settings'}>
                            <Settings />
                        </ActionIcon>
                    </Stack>
                </Aside>
            </MediaQuery>
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
