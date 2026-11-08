import { defineHook } from '@directus/extensions-sdk';

// After login Directus falls back to /content, which is empty for business users.
export default defineHook(({ filter }) => {
	filter('users.create', (payload: any) => {
		if (!payload.last_page) payload.last_page = '/dewit';
		return payload;
	});
});
