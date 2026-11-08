import { computed, defineComponent, h } from 'vue';
import ListView from '../components/ListView.vue';
import { session } from '../api';

function listPage(
	title: string,
	resource: string,
	columns: { key: string; label: string; width?: number }[],
	canCreate: () => boolean,
	searchable = true,
) {
	return defineComponent({
		setup() {
			const allowCreate = computed(canCreate);
			return () => h(ListView, { title, resource, columns, searchable, canCreate: allowCreate.value });
		},
	});
}

const isManager = () => session.role === 'manager';

export const TapestryList = listPage(
	'Tapestries',
	'tapestries',
	[
		{ key: 'inventorynumber', label: 'Inventory Nr' },
		{ key: 'title', label: 'Title', width: 220 },
		{ key: 'artist', label: 'Artist', width: 150 },
		{ key: 'century', label: 'Century', width: 80 },
		{ key: 'location', label: 'Location' },
	],
	isManager,
);

export const ArtistList = listPage(
	'Artists',
	'artists',
	[
		{ key: 'name', label: 'Artist Name' },
		{ key: 'period', label: 'Period' },
		{ key: 'tapestries', label: 'Tapestries' },
	],
	() => session.role !== null,
);

export const CatalogList = listPage(
	'Catalogs',
	'catalogs',
	[
		{ key: 'name', label: 'Catalog' },
		{ key: 'year', label: 'Year' },
		{ key: 'tapestries', label: 'Tapestries' },
	],
	isManager,
);

export const PartnerList = listPage(
	'Business Partners',
	'partners',
	[
		{ key: 'name', label: 'Name' },
		{ key: 'types', label: 'Type' },
		{ key: 'addresstown', label: 'Town' },
		{ key: 'addresscountry', label: 'Country' },
		{ key: 'activeLabel', label: 'Active' },
	],
	isManager,
);

export const OrientationList = listPage('Orientations', 'orientations', [{ key: 'name', label: 'Orientation' }], isManager, false);
