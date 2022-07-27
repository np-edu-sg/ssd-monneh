import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useCatch, useLoaderData, useParams } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
    Aside,
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Group,
    MediaQuery,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core'
import { db } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { ChevronRight } from 'tabler-icons-react'
import { useFormattedCurrency } from '~/hooks/formatter'

interface LoaderData {
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

    const id = parseInt(params.organizationId) || 0
    await requireAuthorization(username, id, () => true)

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

    if (!organization)
        throw json('Organization does not exist', { status: 404 })

    if (!organization.completedSetup)
        return redirect(`/dashboard/organizations/${id}/setup`)

    return json({ organization })
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
    const { organization } = useLoaderData<LoaderData>()

    return (
        <div>
            <Stack>
                <Group position={'apart'}>
                    <Text size={'xl'} weight={600}>
                        Wallets
                    </Text>
                    <Button
                        color={'cyan'}
                        variant={'outline'}
                        component={NavLink}
                        to={`/dashboard/organizations/${organization.id}/wallets/new`}
                    >
                        Add wallet
                    </Button>
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
            </Stack>

            <MediaQuery smallerThan={'sm'} styles={{ display: 'none' }}>
                <Aside
                    p={'md'}
                    hiddenBreakpoint={'sm'}
                    width={{ sm: 200, lg: 300 }}
                >
                    <Stack spacing={'sm'}>
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
