<script setup lang="ts">
import { useFetch, useRequestHeaders } from '#imports'

const { error, pending } = await useFetch('/api/auth/whoami', {
  headers: useRequestHeaders(['cookie']),
})
</script>

<template>
  <div class="h-screen bg-background-100">
    <div class="p-3 container mx-auto font-sans">
      <header class="h-15 flex justify-between items-center">
        <span class="font-semibold text-lg">
          Monneh
        </span>

        <SharedButton v-if="pending || error" variant="alternative" href="/auth/login">
          Login
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
