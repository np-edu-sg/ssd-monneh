import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import { db } from '~/utils/db.server'
import type { ThrownResponse } from '@remix-run/react'
import {
    Form,
    NavLink,
    useCatch,
    useLoaderData,
    useParams,
} from '@remix-run/react'
import {
    Anchor,
    Card,
    Center,
    Grid,
    Group,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core'
import { useFormattedCurrency } from '~/hooks/formatter'
import { useForm } from '@mantine/form'
import { useMemo } from 'react'

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
    const formattedBalance = useFormattedCurrency(data.wallet.balance)

    const form = useForm({
        initialValues: {
            type: 'in',
        },
    })

    const segmentedControlColor = useMemo(
        () => (form.values.type === 'in' ? 'green' : 'red'),
        [form.values.type]
    )

    return (
        <div>
            <Grid>
                <Grid.Col span={12} md={9}>
                    <Stack>
                        <Text weight={600} size={'xl'}>
                            New transaction
                        </Text>

                        <Form onSubmit={form.onSubmit((values) => {})}>
                            <Group>
                                <Text>Transaction type:</Text>
                                <SegmentedControl
                                    data={[
                                        { label: 'Incoming', value: 'in' },
                                        { label: 'Outgoing', value: 'out' },
                                    ]}
                                    color={segmentedControlColor}
                                    {...form.getInputProps('type')}
                                />
                            </Group>
                        </Form>
                    </Stack>
                </Grid.Col>

                <Grid.Col span={12} md={3}>
                    <Card>
                        <Text color={'dimmed'}>Balance</Text>
                        <Text size={'xl'} weight={600}>
                            {formattedBalance}
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>
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
