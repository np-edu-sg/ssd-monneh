<script setup lang="ts">
import type { FetchError } from 'ohmyfetch'
import { definePageMeta, useRouter, useUserInfo } from '#imports'

definePageMeta({
  layout: 'landing',
})

const router = useRouter()
const { data } = await useUserInfo()

const form = reactive({
  email: '',
  password: '',
  loading: false,
  error: null,
})

async function login() {
  form.loading = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form, credentials: 'same-origin' })
    await router.push('/dashboard')
  }
  catch (error) {
    form.error = (error as FetchError).data.message
  }
  form.loading = false
}
</script>

<template>
  <section class="mt-10 md:mt-30 flex flex-col items-start">
    <h1 class="text-5xl font-semibold pb-10">
      Login
    </h1>

    <form class="flex flex-col items-start" @submit.prevent="login">
      <SharedTextInput v-model="form.email" type="email" label="Email" placeholder="qinguan@monneh.sg" />
      <br>
      <SharedTextInput v-model="form.password" type="password" label="Password" placeholder="******" />
      <br>
      <p v-if="form.error" class="text-red-700">
        {{ form.error }}
      </p>
      <br>
      <SharedButton type="submit" :loading="form.loading">
        Login
      </SharedButton>
    </form>

    <transition name="pl">
      <div
        v-if="data"
        class="mt-10 bg-background-100 dark:bg-background-800 border border-background-300 rounded-lg shadow-lg duration-200 p-3"
      >
        <h3 class="text-lg font-display font-semibold text-background-900 dark:text-background-50">
          Previous sign in:
        </h3>

        <span class="text-sm font-body text-background-900 dark:text-background-50">
          {{ data.email }}
        </span>

        <SharedButton class="mt-4" size="sm" variant="secondary" @click="$router.push('/dashboard')">
          Continue with this account
        </SharedButton>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.pl-enter-active,
.pl-leave-active {
    transition: all 0.5s ease;
}

.pl-enter-from,
.pl-leave-to {
    transform: translateX(20px);
    opacity: 0;
}
</style>

