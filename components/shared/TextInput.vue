<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | boolean

  label?: string
  placeholder?: string

  // For select
  options?: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const inputClasses = [
  'p-3 mt-2 md:w-75 lg:w-100 bg-background-100 border-background-300 text-background-900 text-base rounded-lg outline-0 block border',
  'focus:(ring-2 ring-primary-300 border-primary-500)',
  'dark:(bg-background-700 border-background-600 placeholder-background-400 text-background-50)',
]

function inputChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label
    class="block text-sm font-body font-medium text-background-900 dark:text-background-300"
  >
    {{ props.label }}

    <select
      v-if="props.options"
      v-bind="$attrs"

      :value="props.modelValue"
      :class="inputClasses"

      @change="inputChange"
    >
      <option v-if="props.placeholder" disabled selected>{{ props.placeholder }}</option>
      <option v-for="(option, idx) in props.options" :key="idx">{{ option }}</option>
    </select>

    <input
      v-else
      v-bind="$attrs"

      :value="props.modelValue"
      :placeholder="props.placeholder"

      :class="inputClasses"

      @input="inputChange"
    >
  </label>
</template>

<style scoped>
</style>
