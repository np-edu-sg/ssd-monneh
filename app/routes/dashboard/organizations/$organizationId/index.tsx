import type { ThrownResponse } from '@remix-run/react'
import { useCatch, useLoaderData } from '@remix-run/react'
import type { LoaderFunction, ErrorBoundaryComponent } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Center, Stack, Text } from '@mantine/core'
import { db } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'

interface LoaderData {
    organization: {
        id: number
        name: string
        completedSetup: boolean
    }
}

type OrganizationNotFoundError = ThrownResponse<404, string>
type ThrownResponses = OrganizationNotFoundError

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')
    const { username } = await requireUser(request)

    const id = parseInt(params.organizationId) || 0
    const organization = await db.organizationToUser
        .findUnique({
            where: {
                organizationId_username: {
                    organizationId: id,
                    username,
                },
            },
        })
        .organization()

    if (!organization)
        throw json('Organization does not exist', { status: 404 })

    if (!organization.completedSetup)
        return redirect(`/dashboard/organizations/${id}/setup`)

    return json({ organization })
}

export default function OrganizationPage() {
    const { organization } = useLoaderData<LoaderData>()

    return <div>{JSON.stringify(organization)}</div>
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

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
    return (
        <Center
            p={'lg'}
            component={'section'}
            sx={(theme) => ({
                backgroundColor:
                    theme.colorScheme === 'dark'
                        ? theme.fn.rgba(theme.colors.red[9], 0.5)
                        : theme.colors.red[4],
                height: '100%',
            })}
        >
            <Stack>
                <Text weight={600} size={'xl'}>
                    {error.name}
                </Text>
                <Text>{error.message}</Text>
            </Stack>
        </Center>
    )
}
