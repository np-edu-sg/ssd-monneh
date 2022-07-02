<script setup lang="ts">
import {useFetch, useRequestHeaders} from "#imports";

const {error, pending} = await useFetch(`/api/auth/whoami`, {
    headers: useRequestHeaders(['cookie']),
    server: false
})
</script>

<template>
    <div class="h-screen bg-background-100">
        <div class="p-5 container mx-auto font-sans">
            <header class="flex justify-between items-center">
                <span class="font-semibold text-lg">
                    Monneh
                </span>

                <SharedButton variant="alternative" v-if="pending || error">Login</SharedButton>
                <SharedButton v-else>Dashboard</SharedButton>
            </header>

            <main>
                <slot></slot>
            </main>
        </div>
    </div>
</template>
