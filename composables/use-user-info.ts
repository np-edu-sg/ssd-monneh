import { useAsyncData, useRequestHeaders } from '#imports'

export default function () {
  return useAsyncData('/api/auth/whoami', () =>
    $fetch('/api/auth/whoami', {
      headers: useRequestHeaders(['cookie']),
      credentials: 'same-origin',
    }),
  )
}
