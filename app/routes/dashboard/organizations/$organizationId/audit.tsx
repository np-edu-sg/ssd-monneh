import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import invariant from 'tiny-invariant'
import { db } from '~/utils/db.server'
import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useCatch, useLoaderData, useParams } from '@remix-run/react'
import {
    Anchor,
    Breadcrumbs,
    Center,
    ScrollArea,
    Table,
    Text,
} from '@mantine/core'

interface LoaderData {
    organization: {
        name: string
    }
    logs: {
        id: number
        timestamp: Date
        subject: string
        action: string
        objectType: string
        objectId: number
        message: string
    }[]
}

const keyNameMapping: Record<string, string> = {
    id: 'ID',
    timestamp: 'Timestamp',
    subject: 'Username',
    action: 'Action',
    objectType: 'Object',
    objectId: 'Object ID',
    message: 'Notes',
}

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')

    const { username } = await requireUser(request)

    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowReadAuditLog
    )

    const logs = await db.audit.findMany({
        where: {
            organizationId,
        },
        select: {
            id: true,
            timestamp: true,
            subject: true,
            action: true,
            objectType: true,
            objectId: true,
            message: true,
        },
    })

    const organization = await db.organization.findUnique({
        where: {
            id: organizationId,
        },
    })

    invariant(organization, 'Expected organization')

    return json<LoaderData>({ logs: logs.reverse(), organization })
}

export default function OrganizationAuditPage() {
    const { organizationId } = useParams()
    const data = useLoaderData<LoaderData>()

    return (
        <div>
            <Breadcrumbs>
                <Anchor
                    component={NavLink}
                    to={`/dashboard/organizations/${organizationId}`}
                >
                    {data.organization.name}
                </Anchor>
                <Text>Audit</Text>
            </Breadcrumbs>

            <br />

            {data.logs.length > 0 ? (
                <ScrollArea>
                    <Table verticalSpacing={'md'} horizontalSpacing={'sm'}>
                        <thead>
                            <tr>
                                {Object.keys(data.logs[0]).map((key) => (
                                    <th key={key}>{keyNameMapping[key]}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.logs.map((log) => (
                                <tr key={log.id}>
                                    {Object.values(log).map((value, idx) => (
                                        <td key={idx}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </ScrollArea>
            ) : (
                <div>
                    <Text>No logs available</Text>
                </div>
            )}
        </div>
    )
}

export function CatchBoundary() {
    const error = useCatch<ThrownResponse>()

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
