import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['nuxt-windicss'],
  typescript: {
    strict: true
  },
  runtimeConfig: {
    jwtSecret: 'iLoveSecureSoftwareDevelopmentNgeeAnnPolytechnicGettingThatXtra',
    jwtIssuer: 'sussyland',
    jwtExpirationTime: '30m',
    jwtCookieName: "sussyland-auth"
  }
})
