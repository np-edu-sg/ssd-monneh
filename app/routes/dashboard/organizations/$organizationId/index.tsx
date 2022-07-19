import type { ThrownResponse } from '@remix-run/react'
import { useCatch, useLoaderData } from '@remix-run/react'
import type { LoaderFunction, ErrorBoundaryComponent } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Center, Group, Stack, Text } from '@mantine/core'
import { db } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'

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

export default function OrganizationPage() {
    const { organization } = useLoaderData<LoaderData>()

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                {organization.name}
            </Text>

            <Text size={'md'} component={'h2'}>
                Wallets
            </Text>

            <Stack>
                {organization.wallets.map(({ id, name, balance }) => (
                    <Group key={id}>
                        <Text>{name}</Text>
                        <Text>${balance}</Text>
                    </Group>
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
