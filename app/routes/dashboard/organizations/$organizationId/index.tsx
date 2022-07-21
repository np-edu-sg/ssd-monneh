import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useCatch, useLoaderData, useParams } from '@remix-run/react'
import type { LoaderFunction, ErrorBoundaryComponent } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
    Badge,
    Box,
    Button,
    Card,
    Center,
    Group,
    SimpleGrid,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core'
import { db } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { useMemo } from 'react'
import { ChevronRight } from 'tabler-icons-react'

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

const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'SGD',
})

function WalletCard({ id, name, balance }: WalletCardProps) {
    const { organizationId } = useParams()
    const formattedBalance = useMemo(() => formatter.format(balance), [balance])

    invariant(organizationId, 'Expected organizationId')

    return (
        <UnstyledButton
            component={NavLink}
            to={`/dashboard/organizations/${organizationId}/wallets/${id}`}
            p={'md'}
            sx={(theme) => ({
                borderRadius: theme.radius.sm,
                backgroundColor:
                    theme.colorScheme === 'dark'
                        ? theme.colors.gray[9]
                        : theme.colors.gray[0],
            })}
        >
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
        </UnstyledButton>
    )
}

export default function OrganizationPage() {
    const { organization } = useLoaderData<LoaderData>()

    return (
        <div>
            <Text weight={600} component={'h1'} size={'xl'}>
                {organization.name}
            </Text>
            <br />
            <SimpleGrid
                cols={2}
                spacing={'md'}
                breakpoints={[{ maxWidth: 'md', cols: 1, spacing: 'xl' }]}
            >
                <Stack align={'start'}>
                    <Text size={'xl'} weight={600}>
                        Wallets
                    </Text>
                    {organization.wallets.length === 0 ? (
                        <>
                            <Text>You have no wallets!</Text>
                            <Button
                                color={'cyan'}
                                variant={'outline'}
                                component={NavLink}
                                to={`/dashboard/organizations/${organization.id}/wallets/new`}
                            >
                                Add wallet
                            </Button>
                        </>
                    ) : (
                        organization.wallets.map((params) => (
                            <WalletCard {...params} key={params.id} />
                        ))
                    )}
                </Stack>

                <Card>
                    <Stack
                        sx={(theme) => ({
                            [theme.fn.largerThan('md')]: {
                                alignItems: 'flex-end',
                            },
                        })}
                    >
                        <Text size={'xl'} weight={600}>
                            Team members
                        </Text>
                    </Stack>
                </Card>
            </SimpleGrid>
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
