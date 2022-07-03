<template>
  <div class="h-screen bg-background-100">
    <div class="p-3 container mx-auto font-sans">
      <header class="my-5 flex justify-between items-center">
        <span class="font-semibold text-lg">
          Monneh
          <span class="font-medium">
            Dashboard
          </span>
        </span>
      </header>

      <main>
        <slot />
      </main>
    </div>
  </div>
</template>
