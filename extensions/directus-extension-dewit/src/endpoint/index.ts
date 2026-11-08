import { defineEndpoint } from '@directus/extensions-sdk';
import { createRouteFactory } from './lib';
import { registerReferences } from './references';
import { registerSales } from './sales';
import { registerTapestries } from './tapestries';

export default defineEndpoint({
	id: 'dewit',
	handler: (router, context) => {
		const route = createRouteFactory(context);
		registerReferences(router, route);
		registerTapestries(router, route);
		registerSales(router, route);
	},
});
