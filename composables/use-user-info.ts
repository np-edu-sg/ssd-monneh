import { useFetch, useRequestHeaders } from '#imports'

export default function () {
  return useFetch('/api/auth/whoami', {
    headers: useRequestHeaders(['cookie']),
  })
}
