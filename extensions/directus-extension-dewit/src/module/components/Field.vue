<template>
	<div class="dw-field" :class="[size ? `dw-field--${size}` : undefined, { 'dw-field--error': error }]">
		<span class="dw-label">{{ label }}<span v-if="required" class="dw-required" aria-hidden="true">*</span></span>
		<slot />
		<span v-if="error" class="dw-error" role="alert">{{ error }}</span>
		<span v-else-if="hint" class="dw-hint">{{ hint }}</span>
	</div>
</template>

<script setup lang="ts">
defineProps<{ label: string; size?: 'half' | 'full'; required?: boolean; error?: string; hint?: string }>();
</script>
