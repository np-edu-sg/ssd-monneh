import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { formList, useForm } from '@mantine/form'
import { forwardRef, useEffect, useState } from 'react'
import { useDebounce } from 'ahooks'
import type { SelectItem, SelectItemProps } from '@mantine/core'
import {
    ActionIcon,
    Autocomplete,
    Avatar,
    Button,
    Card,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core'
import { randomId } from '@mantine/hooks'
import { Car, Trash } from 'tabler-icons-react'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import { db } from '~/utils/db.server'

const AutoCompleteItem = forwardRef<HTMLDivElement, SelectItemProps>(
    ({ label, value, ...others }: SelectItemProps, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                <Avatar color={'violet'} size={'sm'}>
                    {value && value.length > 0 ? value[0] : 'U'}
                </Avatar>

                <div>
                    <Text>{label}</Text>
                    <Text size={'xs'} color={'dimmed'}>
                        @{value}
                    </Text>
                </div>
            </Group>
        </div>
    )
)

interface ActionData {
    users: { label: string; value: string }[]
}

export const action: ActionFunction = async ({ request }) => {
    const { username } = await requireUser(request)
    const formData = await request.formData()

    const search = formData.get('search')
    if (!search || typeof search !== 'string') {
        return json<ActionData>({
            users: [],
        })
    }

    const data = await db.user.findMany({
        select: { username: true, firstName: true, lastName: true },
        where: {
            OR: {
                username: { search },
                firstName: { search },
                lastName: { search },
                email: { search },
            },
        },
    })

    return json<ActionData>({
        users: data.map(({ firstName, lastName, username }) => ({
            label: `${firstName} ${lastName}`,
            value: username,
        })),
    })
}

export default function OrganizationSetupPage() {
    const submit = useSubmit()
    const data = useActionData<ActionData>()
    const transition = useTransition()

    const form = useForm({
        initialValues: {
            members: formList<{
                username: string
                roleId: number
                key: string
            }>([
                {
                    username: '',
                    roleId: -1,
                    key: randomId(),
                },
            ]),
        },
    })

    const [userSearch, setUserSearch] = useState('')
    const debouncedUserSearch = useDebounce(userSearch, {
        wait: 200,
        leading: true,
    })

    useEffect(() => {
        submit({ search: debouncedUserSearch }, { method: 'post' })
    }, [debouncedUserSearch, submit])

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Setup your organization!
            </Text>

            <Form onSubmit={form.onSubmit(async () => {})}>
                <Card>
                    <Text weight={600} size={'lg'}>
                        Add your teammates
                    </Text>
                    <br />
                    <Stack>
                        {form.values.members.map((item, idx) => (
                            <Group key={item.key}>
                                <Autocomplete
                                    itemComponent={AutoCompleteItem}
                                    filter={() => true}
                                    data={data?.users ?? []}
                                    onItemSubmit={({ value }) =>
                                        form
                                            .getListInputProps(
                                                'members',
                                                idx,
                                                'username'
                                            )
                                            .onChange(value)
                                    }
                                    onChange={setUserSearch}
                                    value={userSearch}
                                />

                                <ActionIcon
                                    color={'red'}
                                    variant={'hover'}
                                    onClick={() =>
                                        form.removeListItem('members', idx)
                                    }
                                >
                                    <Trash size={16} />
                                </ActionIcon>
                            </Group>
                        ))}
                    </Stack>
                    <div>
                        <Button
                            onClick={() => {
                                form.addListItem('members', {
                                    username: '',
                                    roleId: 1,
                                    key: randomId(),
                                })
                            }}
                        >
                            New
                        </Button>
                    </div>
                </Card>
            </Form>
        </div>
    )
}
