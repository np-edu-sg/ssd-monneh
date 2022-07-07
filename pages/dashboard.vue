<script setup lang="ts">
import { definePageMeta, useOrganizations } from '#imports'

definePageMeta({
  middleware: 'auth',
})

const { data: organizations, pending, error } = await useOrganizations()
</script>

<template>
  <div>
    This can only be seen when you're logged in
  </div>

  {{ organizations }}
  <br>
  {{ pending }}
  <br>
  {{ error }}
</template>
