<template>
	<div class="dw-tri" role="radiogroup" :aria-label="label">
		<button
			v-for="option in choices"
			:key="option.text"
			type="button"
			role="radio"
			:aria-checked="modelValue === option.value"
			:class="{ active: modelValue === option.value }"
			@click="$emit('update:modelValue', option.value)"
		>
			{{ option.text }}
		</button>
	</div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean | null; label: string }>();
defineEmits<{ 'update:modelValue': [value: boolean | null] }>();

const choices = [
	{ text: 'Yes', value: true },
	{ text: 'No', value: false },
	{ text: 'Unknown', value: null },
];
</script>

<style>
.dw-tri { display: flex; padding: 4px; gap: 4px; border-radius: var(--theme--border-radius); background: var(--theme--background-normal); }
.dw-tri button { flex: 1; min-height: 36px; padding: 0 6px; border-radius: var(--theme--border-radius); color: var(--theme--foreground-subdued); cursor: pointer; transition: background-color 120ms; }
.dw-tri button:hover { color: var(--theme--foreground); }
.dw-tri button.active { background: var(--theme--primary); color: var(--foreground-inverted, #fff); font-weight: 600; }
</style>
