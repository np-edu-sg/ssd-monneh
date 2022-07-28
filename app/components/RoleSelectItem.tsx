import type { SelectItemProps } from '@mantine/core'
import { Group, Text } from '@mantine/core'
import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef } from 'react'

export interface RoleSelectItemProps
    extends SelectItemProps,
        ComponentPropsWithoutRef<'div'> {
    description: string
}

export const RoleSelectItem = forwardRef<HTMLDivElement, RoleSelectItemProps>(
    function RoleSelectItem(
        { label, description, ...others }: RoleSelectItemProps,
        ref
    ) {
        return (
            <div ref={ref} {...others}>
                <Group noWrap>
                    <div>
                        <Text size={'sm'}>{label}</Text>
                        <Text size={'xs'} color={'dimmed'}>
                            {description}
                        </Text>
                    </div>
                </Group>
            </div>
        )
    }
)
