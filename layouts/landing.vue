<script setup lang="ts">
const {error, pending} = await useWhoAmI()
</script>
<template>
    <div class="h-screen container mx-auto p-5">
        <header class="flex justify-between items-center">
            <span class="font-semibold text-lg">
                Monneh
            </span>

            <div>
                <SharedButton variant="alternative" v-if="error || pending">Login</SharedButton>
                <SharedButton v-else>Dashboard</SharedButton>
            </div>
        </header>

        <main>
            <section class="py-10 md:py-40 flex flex-col gap-8 md:gap-10 items-start">
                <h1 class="text-5xl md:text-7xl font-bold leading-snug">
                    Cash flow management
                    <br>
                    for <span class="text-primary-800">everybody</span>
                </h1>

                <SharedButton>Get started</SharedButton>
            </section>
        </main>
    </div>
</template>
