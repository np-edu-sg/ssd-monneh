<script setup lang="ts">
import type { FetchError } from 'ohmyfetch'
import { definePageMeta, useRouter, useUserInfo } from '#imports'

definePageMeta({
  layout: 'landing',
})

const router = useRouter()
const { error } = await useUserInfo()
if (!error.value)
  router.push('/dashboard')

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  loading: false,
  error: null,
})

async function register() {
  form.loading = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form, credentials: 'same-origin' })
    await router.push('/dashboard')
  }
  catch (error) {
    form.error = (error as FetchError).data.message
  }
  form.loading = false
}
</script>

<template>
  <section>
    <h1 class="text-5xl font-semibold py-1/6 pb-10">
      Register
    </h1>

    <form @submit.prevent="register">
      <SharedTextInput v-model="form.firstName" label="First name" placeholder="Guan" />
      <br>
      <SharedTextInput v-model="form.lastName" label="Last name" placeholder="Qin" />
      <br>
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
  </section>
</template>
