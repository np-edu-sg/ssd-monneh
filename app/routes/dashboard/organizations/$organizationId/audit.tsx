import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import invariant from 'tiny-invariant'
import { db } from '~/utils/db.server'
import { useLoaderData } from '@remix-run/react'
import { ScrollArea, Skeleton, Stack, Table, Text } from '@mantine/core'
import { useMemo } from 'react'

interface LoaderData {
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
    })

    return json<LoaderData>({ logs: logs.reverse() })
}

export default function OrganizationAuditPage() {
    const data = useLoaderData<LoaderData>()

    return (
        <div>
            {data.logs.length > 0 ? (
                <ScrollArea>
                    <Table verticalSpacing={'md'} horizontalSpacing={'sm'}>
                        <thead>
                            <tr>
                                {Object.keys(data.logs[0]).map((key) => (
                                    <th key={key}>{key}</th>
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
