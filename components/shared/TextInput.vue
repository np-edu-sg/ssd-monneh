<script setup lang="ts">
const props = defineProps({
  modelValue: String,
  label: String,
  error: String,
})
const emit = defineEmits(['update:modelValue'])
function inputChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div>
    <label>
      {{ props.label }}
      <input
        v-bind="$attrs"
        :value="props.modelValue" class="text-sm p-2 rounded-lg block outline-primary-300 border border-2"
        :class="[
          props.error ? 'border-red-400' : 'border-background-400',
        ]"
        @change="inputChange"
      >
    </label>
    <p v-if="props.error" class="text-red-600">
      {{ props.error }}
    </p>
  </div>
</template>
