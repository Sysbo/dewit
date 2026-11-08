<template>
	<layout :title="title" :back="back">
		<template #actions>
			<v-button v-if="canDelete" rounded icon kind="danger" secondary @click="confirming = true">
				<v-icon name="delete" />
			</v-button>
			<v-button v-if="canSave" rounded icon :loading="saving" @click="$emit('save')">
				<v-icon name="check" />
			</v-button>
		</template>

		<v-progress-circular v-if="loading" indeterminate />
		<template v-else>
			<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
			<slot />
		</template>

		<v-dialog v-model="confirming" @esc="confirming = false">
			<v-card>
				<v-card-title>Delete this item?</v-card-title>
				<v-card-text>This cannot be undone.</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirming = false">Cancel</v-button>
					<v-button kind="danger" :loading="saving" @click="confirmDelete">Delete</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Layout from './Layout.vue';

defineProps<{
	title: string;
	back: string;
	loading?: boolean;
	saving?: boolean;
	error?: string | null;
	canSave?: boolean;
	canDelete?: boolean;
}>();
const emit = defineEmits(['save', 'delete']);

const confirming = ref(false);
function confirmDelete() {
	confirming.value = false;
	emit('delete');
}
</script>
