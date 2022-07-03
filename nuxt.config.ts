import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['nuxt-windicss'],
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    jwtSecret: 'iLoveSecureSoftwareDevelopmentNgeeAnnPolytechnicGettingThatXtra',
    jwtIssuer: 'sussyland',
    jwtExpirationTime: '30m',
    jwtCookieName: 'sussyland-auth',
  },
  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: true,
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,200;0,400;0,600;0,800;1,200;1,400;1,600;1,800&display=swap',
        },
      ],
    },
  },
})
