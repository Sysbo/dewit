import { defineModule } from '@directus/extensions-sdk';
import ArtistDetail from './pages/ArtistDetail.vue';
import CatalogDetail from './pages/CatalogDetail.vue';
import { ArtistList, CatalogList, OrientationList, PartnerList, TapestryList } from './pages/Lists';
import OrientationDetail from './pages/OrientationDetail.vue';
import PartnerDetail from './pages/PartnerDetail.vue';
import Sales from './pages/Sales.vue';
import TapestryDetail from './pages/TapestryDetail.vue';

export default defineModule({
	id: 'dewit',
	name: 'DeWit Inventory',
	icon: 'texture',
	routes: [
		{ path: '', redirect: '/dewit/tapestries' },
		{ path: 'tapestries', component: TapestryList },
		{ path: 'tapestries/:id', component: TapestryDetail, props: true },
		{ path: 'artists', component: ArtistList },
		{ path: 'artists/:id', component: ArtistDetail, props: true },
		{ path: 'catalogs', component: CatalogList },
		{ path: 'catalogs/:id', component: CatalogDetail, props: true },
		{ path: 'partners', component: PartnerList },
		{ path: 'partners/:id', component: PartnerDetail, props: true },
		{ path: 'orientations', component: OrientationList },
		{ path: 'orientations/:id', component: OrientationDetail, props: true },
		{ path: 'sales', component: Sales },
	],
});
