import { forwardRef } from 'react'
import type { SelectItemProps } from '@mantine/core'
import { Avatar, Group, Text } from '@mantine/core'

export type AutoCompleteFilter = (
    value: string,
    item: { value: string; label: string }
) => boolean

export const AutoCompleteItem = forwardRef<HTMLDivElement, SelectItemProps>(
    function AutoCompleteItem(
        { label, value, ...others }: SelectItemProps,
        ref
    ) {
        return (
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
    }
)
