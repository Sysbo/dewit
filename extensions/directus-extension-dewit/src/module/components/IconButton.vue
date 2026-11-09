<template>
	<v-button v-tooltip.bottom="label" icon :rounded="rounded">
		<v-icon :name="icon" aria-hidden="true" />
		<span class="dw-sr-only">{{ label }}</span>
	</v-button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ icon: string; label: string; rounded?: boolean }>(), { rounded: true });
</script>

<style>
.dw-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
