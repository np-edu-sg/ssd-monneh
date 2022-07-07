import { useAsyncData, useFetch, useRequestHeaders } from '#imports'

export default function () {
  return useAsyncData('/api/organization', () =>
    $fetch('/api/organization', {
      headers: useRequestHeaders(['cookie']),
    }),
  )
}
