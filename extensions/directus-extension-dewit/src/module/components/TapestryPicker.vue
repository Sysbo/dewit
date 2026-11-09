<template>
	<v-drawer v-model="open" :title="title" icon="texture" @cancel="open = false">
		<template v-if="multiple" #actions>
			<span class="dw-position">{{ selected.length }} selected</span>
			<icon-button icon="check" label="Add selected" :disabled="!selected.length" @click="confirm" />
		</template>
		<div class="dw-drawer">
			<tapestry-browser
				v-if="open"
				v-model:selected="selected"
				:sync="false"
				pick-mode
				:selection-mode="multiple ? 'multiple' : 'none'"
				@pick="pick"
			/>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import IconButton from './IconButton.vue';
import { ref, watch } from 'vue';
import TapestryBrowser from './TapestryBrowser.vue';

defineProps<{ title: string; multiple?: boolean }>();
const emit = defineEmits<{ select: [items: any[]] }>();
const open = defineModel<boolean>({ default: false });

const selected = ref<any[]>([]);
watch(open, () => {
	selected.value = [];
});

function confirm() {
	emit('select', selected.value);
	open.value = false;
}

function pick(item: any) {
	emit('select', [item]);
	open.value = false;
}
</script>

<style>
.dw-drawer { padding: 0 var(--content-padding, 32px) var(--content-padding-bottom, 32px); container-type: inline-size; }
</style>
