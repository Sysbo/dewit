<template>
	<private-view :title="title">
		<template v-if="back" #title-outer:prepend>
			<icon-button icon="arrow_back" label="Back" class="dw-back" secondary exact :to="back" />
		</template>

		<template #navigation>
			<v-list nav>
				<v-list-item v-for="item in navigation" :key="item.to" :to="item.to" :active="route.path.startsWith(item.to)">
					<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
					<v-list-item-content><v-text-overflow :text="item.label" /></v-list-item-content>
				</v-list-item>

				<template v-if="session.admin">
					<v-divider class="dw-nav-divider" />
					<span class="dw-nav-label">Administration</span>
					<v-list-item v-for="item in ADMIN_LINKS" :key="item.to" :to="item.to">
						<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
						<v-list-item-content><v-text-overflow :text="item.label" /></v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</template>

		<template #actions><slot name="actions" /></template>

		<div class="dw-content" :class="{ 'dw-content--form': narrow }">
			<v-notice v-if="accessError" type="danger">{{ accessError }}</v-notice>
			<slot v-else />
		</div>
	</private-view>
</template>

<script setup lang="ts">
import IconButton from './IconButton.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { errorText, session, useSessionLoader } from '../api';

// The module bar is global and hides these modules for every role.
const ADMIN_LINKS = [
	{ to: '/content', icon: 'box', label: 'Collections' },
	{ to: '/files', icon: 'folder', label: 'File Library' },
	{ to: '/users', icon: 'people', label: 'Users' },
	{ to: '/insights', icon: 'insights', label: 'Insights' },
];

defineProps<{ title: string; back?: string; narrow?: boolean }>();

const route = useRoute();
const loadSession = useSessionLoader();
const accessError = ref<string | null>(null);

onMounted(async () => {
	try {
		await loadSession();
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
	padding: 12px var(--content-padding, 32px) var(--content-padding-bottom, 32px);
	container-type: inline-size;
}
.dw-content--form { max-width: 1240px; }
.dw-nav-divider { margin: 8px 0; }
.dw-nav-label { display: block; padding: 8px; font-size: 13px; font-weight: 600; color: var(--theme--foreground-subdued); }
.dw-back {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color: var(--theme--foreground);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-color-hover: var(--theme--foreground);
}
.dw-notice { margin-bottom: 24px; }

/* Forms */
.dw-grid {
	display: grid;
	grid-template-columns: repeat(6, minmax(0, 1fr));
	gap: 20px 24px;
}
.dw-grid + .dw-grid { margin-top: 20px; }
.dw-field { grid-column: span 2; min-width: 0; }
.dw-field--half { grid-column: span 3; }
.dw-field--full { grid-column: 1 / -1; }
.dw-label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}
.dw-required { color: var(--theme--danger); margin-left: 2px; }
.dw-hint { display: block; margin-top: 6px; font-size: 13px; color: var(--theme--foreground-subdued); }
.dw-error { display: block; margin-top: 6px; font-size: 13px; color: var(--theme--danger); }
.dw-field--error .v-input .input { border-color: var(--theme--danger) !important; }
.dw-section {
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	padding: 24px;
	margin-bottom: 20px;
}
.dw-section-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin: 0 0 20px;
	font-size: 18px;
	font-weight: 700;
	color: var(--theme--foreground-accent);
}
.dw-columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 20px; }
@container (min-width: 820px) {
	.dw-columns { grid-template-columns: minmax(0, 3fr) minmax(320px, 2fr); align-items: start; }
}
.dw-readonly {
	min-height: var(--theme--form--field--input--height, 60px);
	display: flex;
	align-items: center;
	padding: 0 16px;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-normal);
}
.dw-links { list-style: none; margin: 0; padding: 0; }
.dw-links a, .dw-link { color: var(--theme--primary); }
.dw-links a:hover, .dw-link:hover { text-decoration: underline; }
.dw-links li { padding: 6px 0; }
.dw-actions-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.dw-position { font-size: 13px; color: var(--theme--foreground-subdued); white-space: nowrap; margin-right: 4px; }
@media (max-width: 720px) {
	.dw-field, .dw-field--half { grid-column: 1 / -1; }
	.dw-section { padding: 16px; }
}
</style>
