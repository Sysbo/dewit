import { useApi, useStores } from '@directus/extensions-sdk';
import { reactive } from 'vue';
import type { Role } from '../shared/roles';

export const session = reactive<{ role: Role | null; admin: boolean }>({ role: null, admin: false });

let sessionRequest: Promise<void> | null = null;
let sessionUser: string | undefined;

// The app can change user without a page reload, so the role is tied to the signed-in user.
export function useSessionLoader() {
	const dewit = useDewit();
	const userStore = useStores().useUserStore();

	return () => {
		const userId = userStore.currentUser?.id;
		if (sessionRequest && sessionUser === userId) return sessionRequest;

		sessionUser = userId;
		session.role = null;
		session.admin = false;
		sessionRequest = dewit
			.get('/me')
			.then((me: { role: Role; admin: boolean }) => {
				session.role = me.role;
				session.admin = me.admin;
			})
			.catch((error: unknown) => {
				sessionRequest = null;
				throw error;
			});
		return sessionRequest;
	};
}

export const errorText = (error: any): string =>
	error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Unexpected error';

export const assetUrl = (id: string, size: number) => `/assets/${id}?width=${size}&height=${size}&fit=cover`;
export const pictureUrl = (id: string) => `/assets/${id}?width=1600&fit=inside&withoutEnlargement=true`;

export function useDewit() {
	const api = useApi();
	const unwrap = (response: any) => response.data.data;
	return {
		get: (path: string, params?: Record<string, unknown>) => api.get(`/dewit${path}`, { params }).then(unwrap),
		post: (path: string, body: unknown) => api.post(`/dewit${path}`, body).then(unwrap),
		patch: (path: string, body: unknown) => api.patch(`/dewit${path}`, body).then(unwrap),
		put: (path: string, body: unknown) => api.put(`/dewit${path}`, body).then(unwrap),
		remove: (path: string) => api.delete(`/dewit${path}`).then(unwrap),
	};
}

export function useNotify() {
	const store = useStores().useNotificationsStore();
	return (title: string, type: 'success' | 'warning' | 'error' = 'success') => store.add({ title, type });
}

export type Options = {
	selfPartner: number | null;
	artists: { id: number; name: string; period: string | null }[];
	orientations: { id: number; name: string }[];
	partners: { id: number; name: string; active: boolean }[];
	locations: { id: number; name: string }[];
	sublocations: { id: number; locationid: number; description: string }[];
	relationTypes: { id: number; name: string }[];
	catalogs: { id: number; name: string; year: number }[];
	centuries: string[];
};

const options = reactive<Options>({
	selfPartner: null,
	artists: [],
	orientations: [],
	partners: [],
	locations: [],
	sublocations: [],
	relationTypes: [],
	catalogs: [],
	centuries: [],
});
let optionsRequest: Promise<void> | null = null;

// The dropdown values are shared by every screen and reloaded only after a change.
export function useOptions() {
	const dewit = useDewit();

	function refresh() {
		optionsRequest = dewit
			.get('/options')
			.then((data: Options) => {
				Object.assign(options, data);
			})
			.catch((error: unknown) => {
				optionsRequest = null;
				throw error;
			});
		return optionsRequest;
	}

	if (!optionsRequest) refresh().catch(() => undefined);
	return { options, refresh };
}

export const invalidateOptions = () => {
	optionsRequest = null;
};

export const partnerItems = (partners: Options['partners']) =>
	partners.map((partner) => ({
		text: partner.active ? partner.name : `${partner.name} (inactive)`,
		value: partner.id,
	}));
