<template>
	<div class="dw-field" :class="size ? `dw-field--${size}` : undefined">
		<span class="dw-label">{{ label }}</span>
		<slot />
	</div>
</template>

<script setup lang="ts">
defineProps<{ label: string; size?: 'half' | 'full' }>();
</script>
