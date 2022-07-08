<script setup lang="ts">
import { definePageMeta, useOrganizations } from '#imports'

definePageMeta({
  middleware: 'auth',
})

const { data: organizations, pending, error } = await useOrganizations()

async function createSampleOrganization() {
  await $fetch('/api/organization/seed', { method: 'POST' })
}
</script>

<template>
  <section class="py-3 flex flex-1 flex-col">
    <h1 class="font-semibold text-3xl">
      Your organizations
    </h1>

    <div v-if="organizations.length === 0" class="p-5 md:p-10 flex flex-1 flex-col items-center justify-center">
      <h2 class="text-2xl">
        You have no organizations
      </h2>
      <br>
      <SharedButton variant="secondary" @click="createSampleOrganization">
        Create a sample organization
      </SharedButton>
    </div>
    <div v-for="{ id, name } in organizations" v-else :key="id">
      {{ id }}
      {{ name }}
    </div>
  </section>
</template>
