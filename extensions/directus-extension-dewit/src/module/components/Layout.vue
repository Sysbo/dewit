<template>
	<private-view :title="title">
		<template v-if="back" #title-outer:prepend>
			<v-button class="dw-back" rounded icon secondary exact :to="back">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #navigation>
			<v-list nav>
				<v-list-item v-for="item in navigation" :key="item.to" :to="item.to">
					<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
					<v-list-item-content><v-text-overflow :text="item.label" /></v-list-item-content>
				</v-list-item>
			</v-list>
		</template>

		<template #actions><slot name="actions" /></template>

		<div class="dw-content">
			<v-notice v-if="accessError" type="danger">{{ accessError }}</v-notice>
			<slot v-else />
		</div>
	</private-view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { errorText, session, useDewit } from '../api';

defineProps<{ title: string; back?: string }>();

const dewit = useDewit();
const accessError = ref<string | null>(null);

onMounted(async () => {
	if (session.role) return;
	try {
		session.role = (await dewit.get('/me')).role;
	} catch (e) {
		accessError.value = errorText(e);
	}
});

const navigation = computed(() => {
	const items = [
		{ to: '/dewit/tapestries', icon: 'texture', label: 'Tapestries' },
		{ to: '/dewit/artists', icon: 'brush', label: 'Artists' },
		{ to: '/dewit/catalogs', icon: 'menu_book', label: 'Catalogs' },
		{ to: '/dewit/partners', icon: 'handshake', label: 'Business Partners' },
	];
	if (session.role === 'manager') {
		items.push(
			{ to: '/dewit/sales', icon: 'sell', label: 'Sales' },
			{ to: '/dewit/orientations', icon: 'screen_rotation', label: 'Orientations' },
		);
	}
	return items;
});
</script>

<style>
.dw-content {
	padding: 0 var(--content-padding, 32px) var(--content-padding-bottom, 32px);
	max-width: 1100px;
}
.dw-back {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color: var(--theme--foreground);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-color-hover: var(--theme--foreground);
}
.dw-grid {
	display: grid;
	grid-template-columns: repeat(6, minmax(0, 1fr));
	gap: 20px 24px;
	margin-bottom: 40px;
}
.dw-field { grid-column: span 2; }
.dw-field--half { grid-column: span 3; }
.dw-field--full { grid-column: 1 / -1; }
.dw-field > .dw-label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}
.dw-section {
	grid-column: 1 / -1;
	font-size: 18px;
	font-weight: 700;
	color: var(--theme--foreground-accent);
	border-bottom: var(--theme--border-width, 2px) solid var(--theme--border-color-subdued);
	padding-bottom: 8px;
}
.dw-notice { margin-bottom: 24px; }
.dw-readonly {
	min-height: var(--theme--form--field--input--height, 60px);
	display: flex;
	align-items: center;
	padding: 0 16px;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-subdued);
}
.dw-links { list-style: none; margin: 0; padding: 0; }
.dw-links a { color: var(--theme--primary); }
.dw-links li { padding: 6px 0; }
@media (max-width: 720px) {
	.dw-field, .dw-field--half { grid-column: 1 / -1; }
}
</style>
