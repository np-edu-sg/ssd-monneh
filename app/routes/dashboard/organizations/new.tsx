import { Button, Stack, Text, TextInput } from '@mantine/core'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'
import { db } from '~/utils/db.server'
import type { ActionFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import * as z from 'zod'
import { getValidationErrorObject } from '~/utils/validation.server'
import { requireUser } from '~/utils/session.server'
import { Role } from '~/utils/roles'
import { audit } from '~/utils/audit.server'

interface ActionData {
    errors?: Record<string, string>
}

const createOrganizationBodySchema = z.object({
    name: z
        .string()
        .min(1, 'Organization Name is required')
        .max(64, 'Organization Name must not be longer than 64 characters'),
})

export const action: ActionFunction = async ({ request }) => {
    const { username } = await requireUser(request)

    const formData = await request.formData()
    const result = await createOrganizationBodySchema.safeParseAsync({
        name: formData.get('name'),
    })

    if (!result.success) {
        return json<ActionData>({
            errors: getValidationErrorObject(result.error.issues),
        })
    }

    const { id } = await db.organization.create({
        data: {
            name: result.data.name,
            completedSetup: false,
            users: {
                create: {
                    role: Role.Owner,
                    username,
                },
            },
        },
    })

    await audit(
        username,
        id,
        'organization',
        id,
        'create',
        'Created organization'
    )

    return redirect(`/dashboard/organizations/${id}`)
}

export default function NewOrganization() {
    const submit = useSubmit()
    const transition = useTransition()
    const data = useActionData<ActionData>()
    const form = useForm({
        initialValues: {
            name: '',
        },

        validate: {
            name: (value) => (value.length > 0 ? null : 'Name is required'),
        },
    })

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Create your organization
            </Text>

            <Form
                onSubmit={form.onSubmit(async (values) => {
                    submit(values, { method: 'post' })
                })}
            >
                <Stack spacing={'md'}>
                    <Text>
                        An organization helps you group your funds logically.
                        You can belong in multiple organizations, as well as
                        invite other people to your organization.
                    </Text>

                    <TextInput
                        size={'md'}
                        placeholder={'Organization name'}
                        {...form.getInputProps('name')}
                        error={data?.errors?.name}
                    />

                    <div>
                        <Button
                            variant={'gradient'}
                            gradient={{
                                from: 'violet',
                                to: 'grape',
                            }}
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
