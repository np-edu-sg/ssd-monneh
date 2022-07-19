import { Button, Stack, Text, TextInput } from '@mantine/core'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'

export default function NewWalletPage() {
    const submit = useSubmit()
    const data = useActionData()
    const transition = useTransition()

    const form = useForm({
        initialValues: {
            name: '',
        },
    })

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Create your wallet
            </Text>

            <Form
                onSubmit={form.onSubmit(async (values) => {
                    submit(values, { method: 'post' })
                })}
            >
                <Stack spacing={'md'}>
                    <Text>
                        A wallet helps you group funds within an organization by
                        how they're stored. For example, a wallet could be 'POSB
                        Bank'.
                    </Text>

                    <TextInput
                        size={'md'}
                        placeholder={'Organization name'}
                        error={data?.errors?.email}
                        {...form.getInputProps('name')}
                    />

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
