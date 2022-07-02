import {navigateTo, useFetch} from "#imports";

export default defineNuxtRouteMiddleware((to, from) => {
  const {error} = useFetch(`/api/auth/whoami`)
  if (error) {
    return '/auth/login'
  } else {
    return true
  }
})
