import { Button, Paper, SimpleGrid, Text, TextInput } from '@mantine/core'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'
import type { LoaderFunction } from '@remix-run/node'

export const loader: LoaderFunction = () => {
    return {}
}

export default function NewOrganization() {
    const submit = useSubmit()
    const data = useActionData()
    const transition = useTransition()

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
            <Text component={'h1'} size={'xl'} style={{ marginTop: 0 }}>
                Create your organization!
            </Text>

            <Form
                onSubmit={form.onSubmit(async (values) => {
                    submit(values, { method: 'post' })
                })}
            >
                <SimpleGrid spacing={'md'}>
                    <Paper shadow={'xs'} p={'xl'} withBorder>
                        <Text weight={600} size={'lg'}>
                            1. Organization
                        </Text>

                        <br />

                        <Text>
                            An organization helps you group your funds
                            logically. You can belong in multiple organizations,
                            as well as invite other people to your organization.
                        </Text>

                        <br />

                        <TextInput
                            size={'md'}
                            placeholder={'Organization name'}
                            error={data?.errors?.email}
                            {...form.getInputProps('name')}
                        />
                    </Paper>

                    <Paper shadow={'xs'} p={'xl'} withBorder>
                        <Text weight={600} size={'lg'}>
                            2. Roles
                        </Text>

                        <br />

                        <Text>
                            Here you can specify permissions for the different
                            roles in your organization.
                            <br />
                            <br />
                            For example, a role could be "Finance department",
                            which would have the ability to reimburse
                            transactions.
                        </Text>

                        <br />

                        <TextInput
                            size={'md'}
                            placeholder={'Organization name'}
                            error={data?.errors?.email}
                            {...form.getInputProps('name')}
                        />
                    </Paper>

                    <Paper shadow={'xs'} p={'xl'} withBorder>
                        <Text weight={600} size={'lg'}>
                            3. Members
                        </Text>

                        <br />

                        <Text>
                            Lastly, start inviting people to your organization!
                        </Text>

                        <br />

                        <TextInput
                            size={'md'}
                            placeholder={'Organization name'}
                            error={data?.errors?.email}
                            {...form.getInputProps('name')}
                        />

                        <br />

                        <Button
                            type={'submit'}
                            variant={'gradient'}
                            gradient={{ from: 'violet', to: 'grape' }}
                            loading={transition.state === 'submitting'}
                        >
                            Create organization!
                        </Button>
                    </Paper>
                </SimpleGrid>
            </Form>
        </div>
    )
}
