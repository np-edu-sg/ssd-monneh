import { useMemo } from 'react'

const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'SGD',
})

export function useFormattedCurrency(amount: number) {
    return useMemo(() => formatter.format(amount), [amount])
}
