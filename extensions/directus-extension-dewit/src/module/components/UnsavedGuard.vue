<template>
	<v-dialog :model-value="pending !== null" @esc="answer(false)" @update:model-value="answer(false)">
		<v-card>
			<v-card-title>Discard unsaved changes?</v-card-title>
			<v-card-text>Your changes on this page have not been saved.</v-card-text>
			<v-card-actions>
				<v-button secondary @click="answer(false)">Keep editing</v-button>
				<v-button kind="danger" @click="answer(true)">Discard</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

const props = defineProps<{ dirty: boolean }>();

const pending = ref<((leave: boolean) => void) | null>(null);

function answer(leave: boolean) {
	pending.value?.(leave);
	pending.value = null;
}

const guard = () => (props.dirty ? new Promise<boolean>((resolve) => (pending.value = resolve)) : true);
onBeforeRouteLeave(guard);
onBeforeRouteUpdate(guard);

function warnOnUnload(event: BeforeUnloadEvent) {
	if (props.dirty) event.preventDefault();
}
onMounted(() => window.addEventListener('beforeunload', warnOnUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnOnUnload));
</script>
