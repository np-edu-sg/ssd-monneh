import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import invariant from 'tiny-invariant'
import { db } from '~/utils/db.server'
import { useLoaderData } from '@remix-run/react'

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

    return json({ logs })
}

export default function OrganizationAuditPage() {
    const data = useLoaderData()

    return (
        <div>
            <pre>{JSON.stringify(data.logs, null, 2)}</pre>
        </div>
    )
}
