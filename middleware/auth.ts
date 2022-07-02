import {navigateTo, useFetch, useRequestHeaders} from "#imports";

export default defineNuxtRouteMiddleware((to, from) => {
  const {error} = useFetch(`/api/auth/whoami`, {
    headers: useRequestHeaders(['cookie']),
  })
  if (error) {
    return '/auth/login'
  } else {
    return true
  }
})
