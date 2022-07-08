import { useAsyncData, useRequestHeaders } from '#imports'

export default function () {
  return useAsyncData('/api/organization', async () =>
    await $fetch<{ id: number; name: string }[]>('/api/organization', {
      headers: useRequestHeaders(['cookie']),
    }),
  )
}
