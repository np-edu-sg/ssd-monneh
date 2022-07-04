<script setup lang="ts">
import { useFetch, useRequestHeaders, useRoute, useUserInfo } from '#imports'

const route = useRoute()
const { pending, error } = await useUserInfo()
</script>

<template>
  <div class="h-screen bg-background-100 overflow-y-scroll">
    <div class="p-3 md:px-10 lg:px-20 container mx-auto font-sans">
      <header class="h-15 flex justify-between items-center">
        <span class="font-semibold text-lg">
          Monneh
        </span>

        <SharedButton
          v-if="pending || error"
          variant="alternative"
          :href="route.path === '/auth/login' ? '/auth/register' : '/auth/login'"
        >
          {{ route.path === '/auth/login' ? 'Register' : 'Login' }}
        </SharedButton>
        <SharedButton v-else href="/dashboard">
          Dashboard
        </SharedButton>
      </header>

      <main>
        <slot />
      </main>
    </div>
  </div>
</template>
