<script setup lang="ts">
import {definePageMeta} from "#imports";

definePageMeta({
    middleware: 'auth'
})
</script>

<template>
    This can only be seen when you're logged in
</template>
