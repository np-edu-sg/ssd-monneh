<script setup lang="ts">
import type { FetchError } from 'ohmyfetch'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'landing',
})

const form = reactive({
  email: '',
  password: '',
  error: null,
})

async function login() {
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form, credentials: 'same-origin' })
  }
  catch (error) {
    form.error = (error as FetchError).data.message
  }
}
</script>

<template>
  <section>
    <h1 class="text-5xl font-semibold py-20">
      Login
    </h1>

    <form @submit.prevent="login">
      <SharedTextInput v-model="form.email" type="email" label="Email" placeholder="qinguan@monneh.sg" />
      <br>
      <SharedTextInput v-model="form.password" type="password" label="Password" placeholder="******" />
      <br>
      <p v-if="form.error" class="text-red-700">
        {{ form.error }}
      </p>
      <br>
      <SharedButton type="submit">
        Login
      </SharedButton>
    </form>
  </section>
</template>
