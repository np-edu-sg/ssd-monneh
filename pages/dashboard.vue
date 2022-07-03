<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <div>
    This can only be seen when you're logged in
  </div>
</template>
