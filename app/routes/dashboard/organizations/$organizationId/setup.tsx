import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { formList, useForm } from '@mantine/form'
import { forwardRef, useCallback } from 'react'
import { useDebounceFn } from 'ahooks'
import type { SelectItemProps } from '@mantine/core'
import {
    ActionIcon,
    Autocomplete,
    Avatar,
    Button,
    Card,
    Group,
    ScrollArea,
    Table,
    Text,
} from '@mantine/core'
import { randomId } from '@mantine/hooks'
import { Plus, Trash } from 'tabler-icons-react'
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
    await requireUser(request)
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

type AutocompleteFilter = (
    value: string,
    item: { value: string; label: string }
) => boolean

export default function OrganizationSetupPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const data = useActionData<ActionData>()

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

    const { run: runSearch } = useDebounceFn(
        (search: string) => {
            submit({ search }, { method: 'post' })
        },
        { wait: 200 }
    )

    const autocompleteFilter: AutocompleteFilter = useCallback(
        (_, { value }) => {
            return (
                form.values.members
                    .map(({ username }) => username)
                    .indexOf(value) === -1
            )
        },
        [form.values.members]
    )

    const handleAutocompleteChange = (idx: number) => (value: string) => {
        form.getListInputProps('members', idx, 'username').onChange(value)
        runSearch(value)
    }

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Setup your organization!
            </Text>

            <Form onSubmit={form.onSubmit(async () => {})}>
                <Card>
                    <Group position={'apart'}>
                        <Text weight={600} size={'lg'}>
                            Add your teammates
                        </Text>

                        <Button
                            variant={'outline'}
                            onClick={() => {
                                form.addListItem('members', {
                                    username: '',
                                    roleId: 1,
                                    key: randomId(),
                                })
                            }}
                        >
                            <Plus size={20} />
                        </Button>
                    </Group>

                    <br />

                    <ScrollArea offsetScrollbars scrollbarSize={10}>
                        <Table verticalSpacing={'sm'}>
                            <colgroup>
                                <col style={{ width: '75%', minWidth: 300 }} />
                                <col style={{ width: '20%', minWidth: 200 }} />
                                <col style={{ width: '5%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Role</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.values.members.map((item, idx) => (
                                    <tr key={item.key}>
                                        <td>
                                            <Autocomplete
                                                placeholder={
                                                    'Username or email'
                                                }
                                                itemComponent={AutoCompleteItem}
                                                filter={autocompleteFilter}
                                                data={data?.users ?? []}
                                                value={
                                                    form.getListInputProps(
                                                        'members',
                                                        idx,
                                                        'username'
                                                    ).value
                                                }
                                                onChange={handleAutocompleteChange(
                                                    idx
                                                )}
                                            />
                                        </td>
                                        <td>Role</td>
                                        <td>
                                            <ActionIcon
                                                color={'red'}
                                                variant={'hover'}
                                                onClick={() =>
                                                    form.removeListItem(
                                                        'members',
                                                        idx
                                                    )
                                                }
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </ScrollArea>
                </Card>
            </Form>
        </div>
    )
}
