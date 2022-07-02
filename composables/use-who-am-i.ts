import {useFetch, useRequestHeaders} from '#imports'

export function useWhoAmI() {
  return useFetch(`/api/auth/whoami`, {
    headers: useRequestHeaders(['cookie']),
    credentials: 'same-origin'
  })
}
