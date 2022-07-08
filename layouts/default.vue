<template>
  <div class="h-screen bg-background-100">
    <div class="p-3 container mx-auto font-sans h-full flex flex-col">
      <header class="h-15 flex justify-between items-center">
        <span class="font-semibold text-lg">
          Monneh
          <span class="font-medium">
            Dashboard
          </span>
        </span>
      </header>

      <main class="flex flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
