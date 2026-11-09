<template>
	<v-input :model-value="text" :nullable="false" :placeholder="placeholder" :aria-label="placeholder" @update:model-value="onInput">
		<template #prepend><v-icon name="search" aria-hidden="true" /></template>
		<template #append>
			<v-icon v-if="text" name="close" clickable aria-label="Clear search" @click="onInput('', true)" />
		</template>
	</v-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ value: string; placeholder: string }>();
const emit = defineEmits<{ search: [value: string] }>();

const text = ref(props.value);
watch(
	() => props.value,
	(value) => {
		if (value !== text.value.trim()) text.value = value;
	},
);

let timer: ReturnType<typeof setTimeout>;
function onInput(value: string, immediate = false) {
	text.value = value;
	clearTimeout(timer);
	timer = setTimeout(() => emit('search', value.trim()), immediate ? 0 : 250);
}
</script>
