import { MANAGER_ROLE_ID, STANDARD_ROLE_ID, type Role } from '../shared/roles';

export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
		public code = 'DEWIT_ERROR',
	) {
		super(message);
	}
}

export const badRequest = (message: string) => new HttpError(400, message, 'INVALID_PAYLOAD');
export const notFound = (what: string) => new HttpError(404, `${what} not found`, 'NOT_FOUND');
export const conflict = (message: string) => new HttpError(409, message, 'CONFLICT');
export const forbidden = (message = 'You are not allowed to perform this action') =>
	new HttpError(403, message, 'FORBIDDEN');

export type Tx = { trx: any; items: (collection: string) => any };
export type Ctx = {
	db: any;
	role: Role;
	params: Record<string, string>;
	query: Record<string, any>;
	body: any;
	tx: <T>(fn: (t: Tx) => Promise<T>) => Promise<T>;
};

export const MANAGER_ONLY: Role[] = ['manager'];
export const ALL_ROLES: Role[] = ['manager', 'standard'];

export function roleOf(accountability: any): Role | null {
	if (!accountability?.user) return null;
	if (accountability.admin) return 'manager';
	const roles: string[] = accountability.roles ?? (accountability.role ? [accountability.role] : []);
	if (roles.includes(MANAGER_ROLE_ID)) return 'manager';
	if (roles.includes(STANDARD_ROLE_ID)) return 'standard';
	return null;
}

export function createRouteFactory({ database, getSchema, services }: any) {
	const { ItemsService } = services;

	// Users have no permission on the domain collections: this endpoint is the access control.
	const tx = async <T>(fn: (t: Tx) => Promise<T>): Promise<T> => {
		const schema = await getSchema();
		return database.transaction((trx: any) =>
			fn({ trx, items: (collection) => new ItemsService(collection, { schema, knex: trx, accountability: null }) }),
		);
	};

	return (allowed: Role[], handler: (ctx: Ctx) => Promise<unknown>) =>
		async (req: any, res: any, next: any) => {
			try {
				const role = roleOf(req.accountability);
				if (!role) throw forbidden();
				if (!allowed.includes(role)) throw forbidden();
				const data = await handler({
					db: database,
					role,
					params: req.params,
					query: req.query,
					body: req.body ?? {},
					tx,
				});
				res.json({ data });
			} catch (error) {
				if (error instanceof HttpError) {
					res.status(error.status).json({ errors: [{ message: error.message, extensions: { code: error.code } }] });
				} else {
					next(error);
				}
			}
		};
}

export function text(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const result = String(value).trim();
	return result === '' ? null : result;
}

export function requiredText(value: unknown, label: string): string {
	const result = text(value);
	if (result === null) throw badRequest(`${label} is required`);
	return result;
}

export function integer(value: unknown, label: string): number | null {
	const raw = text(value);
	if (raw === null) return null;
	if (!/^\d+$/.test(raw)) throw badRequest(`${label} must be a whole positive number`);
	return Number(raw);
}

export function decimal(value: unknown, label: string): number | null {
	const raw = text(value);
	if (raw === null) return null;
	const parsed = Number(raw.replace(',', '.'));
	if (!Number.isFinite(parsed) || parsed < 0) throw badRequest(`${label} must be a positive number`);
	return Math.round(parsed * 100) / 100;
}

export function triState(value: unknown): boolean | null {
	return value === true || value === false ? value : null;
}

export function dateOnly(value: unknown, label: string): string | null {
	const raw = text(value);
	if (raw === null) return null;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) throw badRequest(`${label} is not a valid date`);
	return raw;
}

export function idParam(value: unknown, what: string): number {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) throw notFound(what);
	return id;
}

export function idList(value: unknown, label: string): number[] {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) throw badRequest(`${label} must be a list`);
	return [...new Set(value.map((entry) => idParam(entry, label)))];
}

export function likePattern(search: string): string {
	return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
}

export function paging(query: Record<string, any>) {
	const page = Math.max(1, Number(query.page) || 1);
	const limit = Math.min(200, Math.max(1, Number(query.limit) || 25));
	return { page, limit, offset: (page - 1) * limit };
}

export async function count(q: any): Promise<number> {
	const [row] = await q.clone().clearSelect().clearOrder().count('* as count');
	return Number(row.count);
}

export async function ensureExists(db: any, table: string, id: number | null, label: string) {
	if (id === null) return;
	if (!(await db(table).where({ id }).first())) throw badRequest(`${label} does not exist`);
}

export async function blockIfUsed(db: any, checks: [table: string, column: string, label: string][], id: number) {
	const used: string[] = [];
	for (const [table, column, label] of checks) {
		if (await db(table).where({ [column]: id }).first()) used.push(label);
	}
	if (used.length) throw conflict(`Cannot delete: still linked to ${used.join(', ')}`);
}
