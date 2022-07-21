import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { db } from '~/utils/db.server'
import type { ThrownResponse } from '@remix-run/react'
import { NavLink, useCatch, useLoaderData, useParams } from '@remix-run/react'
import { Anchor, Center, Text } from '@mantine/core'

interface LoaderData {
    wallet: {
        id: number
        name: string
        balance: number
    }
}

type WalletNotFound = ThrownResponse<404, string>
type ThrownResponses = WalletNotFound

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')
    invariant(params.walletId, 'Expected params.walletId')

    const organizationId = parseInt(params.organizationId)
    const walletId = parseInt(params.walletId)
    const { username } = await requireUser(request)
    await requireAuthorization(username, organizationId, () => true)

    const wallet = await db.wallet.findFirst({
        select: {
            id: true,
            name: true,
            balance: true,
        },
        where: {
            organizationId,
            id: walletId,
        },
    })
    if (!wallet) throw json('Wallet does not exist', { status: 404 })

    return json<LoaderData>({
        wallet: { ...wallet, balance: wallet.balance.toNumber() },
    })
}

export default function WalletPage() {
    const { organizationId } = useParams()
    const data = useLoaderData<LoaderData>()

    return (
        <div>
            <Anchor
                component={NavLink}
                to={`/dashboard/organizations/${organizationId}`}
            >
                {'<'} Back to organization
            </Anchor>
            <Text weight={600} size={'xl'} component={'h1'}>
                {data.wallet.name}
            </Text>
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
