import {
    Anchor,
    Button,
    Center,
    NumberInput,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core'
import {
    Form,
    NavLink,
    useActionData,
    useCatch,
    useParams,
    useSubmit,
    useTransition,
} from '@remix-run/react'
import { useForm } from '@mantine/form'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import * as z from 'zod'
import { getValidationErrorObject } from '~/utils/validation.server'
import { requireUser } from '~/utils/session.server'
import { requireAuthorization } from '~/utils/authorization.server'
import invariant from 'tiny-invariant'
import { db } from '~/utils/db.server'

const createWalletBodySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    balance: z.string().regex(/^\d+$/).transform(Number),
})

const balanceSchema = z
    .number()
    .min(0, 'Balance must be greater than 0')
    .step(0.01, 'Balance cannot have more than 2 decimal points')

interface ActionData {
    errors: Record<string, string>
}

export const action: ActionFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')

    const { username } = await requireUser(request)
    const formData = await request.formData()
    const result = await createWalletBodySchema.safeParseAsync({
        name: formData.get('name'),
        balance: formData.get('balance'),
    })
    if (!result.success) {
        return json<ActionData>({
            errors: getValidationErrorObject(result.error.issues),
        })
    }
    const result2 = await balanceSchema.safeParseAsync(result.data.balance)
    if (!result2.success) {
        return json<ActionData>({
            errors: getValidationErrorObject(result2.error.issues),
        })
    }

    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowCreateWallets
    )

    const { id } = await db.wallet.create({
        data: {
            name: result.data.name,
            balance: result2.data,
            organization: {
                connect: {
                    id: organizationId,
                },
            },
        },
    })

    return redirect(`/dashboard/organizations/${organizationId}/wallets/${id}`)
}

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')

    const { username } = await requireUser(request)
    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowCreateWallets
    )

    return json({})
}

export default function NewWalletPage() {
    const submit = useSubmit()
    const data = useActionData()
    const transition = useTransition()
    const { organizationId } = useParams()

    const form = useForm({
        initialValues: {
            name: '',
            balance: 0,
        },
    })

    return (
        <div>
            <Anchor
                component={NavLink}
                to={`/dashboard/organizations/${organizationId}`}
            >
                {'<'} Back to organization
            </Anchor>
            <Text weight={600} size={'xl'} component={'h1'}>
                Create your wallet
            </Text>
            <Form
                onSubmit={form.onSubmit(async ({ name, balance }) => {
                    submit(
                        {
                            name,
                            balance: balance.toString(),
                        },
                        { method: 'post' }
                    )
                })}
            >
                <Stack spacing={'md'}>
                    <Text>
                        A wallet helps you group funds within an organization by
                        how they're stored. For example, a wallet could be 'POSB
                        Bank'.
                    </Text>

                    <SimpleGrid>
                        <TextInput
                            size={'md'}
                            placeholder={'Wallet name'}
                            error={data?.errors?.email}
                            {...form.getInputProps('name')}
                        />

                        <NumberInput
                            size={'md'}
                            label={'Current balance'}
                            precision={2}
                            min={0}
                            max={999999999999}
                            step={0.05}
                            parser={(value) =>
                                (value ?? '$ 0').replace(/\$\s?|(,*)/g, '')
                            }
                            formatter={(value) =>
                                !Number.isNaN(parseFloat(value ?? '0'))
                                    ? `$ ${value}`.replace(
                                          /\B(?=(\d{3})+(?!\d))/g,
                                          ','
                                      )
                                    : '$ '
                            }
                            {...form.getInputProps('balance')}
                        />
                    </SimpleGrid>

                    <div>
                        <Button
                            color={'cyan'}
                            type={'submit'}
                            loading={transition.state === 'submitting'}
                        >
                            Create {form.values.name}
                        </Button>
                    </div>
                </Stack>
            </Form>
        </div>
    )
}
