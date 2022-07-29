import { useFormattedCurrency } from '~/hooks/formatter'
import { useMemo } from 'react'
import { Badge, Card, Group, Text } from '@mantine/core'
import { NavLink } from '@remix-run/react'
import { TransactionState } from '@prisma/client'

interface TransactionCardProps {
    id: number
    entryDateTime: string
    transactionValue: number
    state: TransactionState
    linkPrefix: string
}

const TransactionStateMessages = {
    [TransactionState.Pending]: 'Pending approval',
    [TransactionState.Approved]: 'Approved',
    [TransactionState.Rejected]: 'Rejected',
}

const TransactionStateBadgeColor = {
    [TransactionState.Pending]: 'gray',
    [TransactionState.Approved]: 'green',
    [TransactionState.Rejected]: 'red',
}

export function TransactionCard({
    id,
    entryDateTime,
    transactionValue,
    state,
    linkPrefix,
}: TransactionCardProps) {
    const value = useFormattedCurrency(transactionValue)
    const dateString = useMemo(() => {
        return new Date(entryDateTime).toLocaleDateString()
    }, [entryDateTime])

    return (
        <Card to={`${linkPrefix}/${id}`} component={NavLink}>
            <Group position={'apart'}>
                <Group align={'center'}>
                    <Text weight={600}>#{id}</Text>
                    <Text color={'dimmed'}>{dateString}</Text>
                </Group>
                <Group align={'center'}>
                    <Text>{value}</Text>
                    <Badge color={TransactionStateBadgeColor[state]}>
                        {TransactionStateMessages[state]}
                    </Badge>
                </Group>
            </Group>
        </Card>
    )
}
