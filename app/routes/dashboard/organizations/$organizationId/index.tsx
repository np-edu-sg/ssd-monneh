import type { ThrownResponse } from '@remix-run/react'
import { useCatch, useLoaderData } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Center, Text } from '@mantine/core'
import { db } from '~/utils/db.server'

interface LoaderData {
    organization: {
        id: number
        name: string
        completedSetup: boolean
    }
}

type OrganizationNotFoundError = ThrownResponse<404, string>
type OrganizationIDNotProvided = ThrownResponse<400, string>

type ThrownResponses = OrganizationNotFoundError | OrganizationIDNotProvided

export const loader: LoaderFunction = async ({ params }) => {
    if (!params.organizationId)
        throw json('Organization ID is required', { status: 400 })

    const id = parseInt(params.organizationId)
    const organization = await db.organization.findUnique({
        select: { id: true, name: true, completedSetup: true },
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
