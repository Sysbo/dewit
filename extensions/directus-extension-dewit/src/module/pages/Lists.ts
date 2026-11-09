import { computed, defineComponent, h } from 'vue';
import { useRoute } from 'vue-router';
import ListView from '../components/ListView.vue';
import { session, useOptions } from '../api';

const isManager = () => session.role === 'manager';

export const ArtistList = defineComponent({
	setup: () => () =>
		h(ListView, {
			title: 'Artists',
			resource: 'artists',
			itemLabel: 'artist',
			defaultSort: 'name',
			canCreate: session.role !== null,
			emptyIcon: 'brush',
			columns: [
				{ key: 'name', label: 'Artist Name', width: 320 },
				{ key: 'period', label: 'Period', width: 240 },
				{ key: 'tapestries', label: 'Tapestries', width: 120 },
			],
		}),
});

export const CatalogList = defineComponent({
	setup: () => () =>
		h(ListView, {
			title: 'Catalogs',
			resource: 'catalogs',
			itemLabel: 'catalog',
			defaultSort: '-year',
			canCreate: isManager(),
			emptyIcon: 'menu_book',
			columns: [
				{ key: 'name', label: 'Catalog', width: 320 },
				{ key: 'year', label: 'Year', width: 120 },
				{ key: 'tapestries', label: 'Tapestries', width: 120 },
			],
		}),
});

export const PartnerList = defineComponent({
	setup() {
		const { options } = useOptions();
		const filters = computed(() => [
			{ key: 'type', label: 'Type', items: options.relationTypes.map((type) => ({ text: type.name, value: String(type.id) })) },
			{
				key: 'active',
				label: 'Status',
				items: [
					{ text: 'Active', value: 'yes' },
					{ text: 'Inactive', value: 'no' },
				],
			},
		]);
		return () =>
			h(ListView, {
				title: 'Business Partners',
				resource: 'partners',
				itemLabel: 'partner',
				defaultSort: 'name',
				canCreate: isManager(),
				emptyIcon: 'handshake',
				filters: filters.value,
				columns: [
					{ key: 'name', label: 'Name', width: 280 },
					{ key: 'types', label: 'Type', width: 200, sortable: false },
					{ key: 'addresstown', label: 'Town', width: 180 },
					{ key: 'addresscountry', label: 'Country', width: 160 },
					{ key: 'activeLabel', label: 'Active', width: 90, sortable: false },
				],
			});
	},
});

export const OrientationList = defineComponent({
	setup: () => () =>
		h(ListView, {
			title: 'Orientations',
			resource: 'orientations',
			itemLabel: 'orientation',
			defaultSort: 'name',
			canCreate: isManager(),
			searchable: false,
			emptyIcon: 'screen_rotation',
			columns: [{ key: 'name', label: 'Orientation', width: 320, sortable: false }],
		}),
});

const SALE_TABS = [
	{ text: 'For sale', value: 'active' },
	{ text: 'Sold', value: 'sold' },
];
const COMMON_SALE_COLUMNS = [
	{ key: 'thumbnail', label: '', type: 'thumb' as const },
	{ key: 'inventorynumber', label: 'Inventory Nr', width: 150 },
	{ key: 'title', label: 'Title', width: 240, sortable: false },
	{ key: 'seller', label: 'Seller', width: 170 },
	{ key: 'minprice', label: 'Min. Price', width: 110, type: 'price' as const },
];

export const SalesColumns = {
	active: [...COMMON_SALE_COLUMNS, { key: 'saledatestart', label: 'Since', width: 120 }],
	sold: [
		...COMMON_SALE_COLUMNS,
		{ key: 'buyer', label: 'Sold To', width: 170 },
		{ key: 'transactionprice', label: 'Price', width: 110, type: 'price' as const },
		{ key: 'transactiondate', label: 'Sold On', width: 120 },
	],
};

export function useSalesListProps() {
	const route = useRoute();
	return computed(() => ({
		title: 'Sales',
		resource: 'sales',
		itemLabel: 'sale',
		tabs: SALE_TABS,
		emptyIcon: 'sell',
		emptyTitle: route.query.status === 'sold' ? 'No past sale' : 'Nothing for sale',
		defaultSort: route.query.status === 'sold' ? '-transactiondate' : '-saledatestart',
		columns: route.query.status === 'sold' ? SalesColumns.sold : SalesColumns.active,
		rowPath: (item: any) => `/dewit/sales/${item.tapestry}`,
	}));
}
