import { badRequest, HttpError, type Tx } from './lib';

export const today = () => new Date().toISOString().slice(0, 10);

export function dateString(value: unknown): string | null {
	if (!value) return null;
	if (value instanceof Date) {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
	}
	return String(value).slice(0, 10);
}

export const numberOrNull = (value: unknown) => (value === null || value === undefined ? null : Number(value));

export function tapestryLabel(row: { inventorynumber: string; titlenl?: string; titleen?: string; titlefr?: string }) {
	const titles = [row.titlenl, row.titleen, row.titlefr].filter(Boolean).join(' / ');
	return titles ? `${row.inventorynumber} – ${titles}` : row.inventorynumber;
}

function selfQuery(db: any) {
	return db('businesspartner as p')
		.join('bprelationship as r', 'r.businesspartnerid', 'p.id')
		.join('relationtype as t', 't.id', 'r.relationtypeid')
		.whereRaw('lower(t.name) = ?', ['self']);
}

export async function selfPartnerId(db: any): Promise<number> {
	const row = await selfQuery(db).first('p.id');
	if (!row) throw new HttpError(500, 'No business partner is declared as SELF');
	return row.id;
}

export async function selfRelationTypeId(db: any): Promise<number> {
	const row = await db('relationtype').whereRaw('lower(name) = ?', ['self']).first('id');
	if (!row) throw new HttpError(500, 'The SELF relation type does not exist');
	return row.id;
}

export type LocationTarget = { bp: number; location: number | null; sublocation: number | null } | null;

export async function resolveLocation(
	db: any,
	self: number,
	bp: number | null,
	location: number | null,
	sublocation: number | null,
): Promise<LocationTarget> {
	if (bp === null) {
		if (location !== null || sublocation !== null) throw badRequest('Select the business partner of the location first');
		return null;
	}
	if (!(await db('businesspartner').where({ id: bp }).first())) throw badRequest('Location business partner does not exist');
	if (bp !== self) return { bp, location: null, sublocation: null };

	if (sublocation !== null && location === null) throw badRequest('Select a location before a sub-location');
	if (location !== null && !(await db('location').where({ id: location, bpid: self }).first())) {
		throw badRequest('This location does not belong to DeWit');
	}
	if (sublocation !== null && !(await db('sublocation').where({ id: sublocation, locationid: location }).first())) {
		throw badRequest('This sub-location does not belong to the selected location');
	}
	return { bp, location, sublocation };
}

// History tables: the active row is closed and a new one opened only on a real change.
export async function applyLocation({ trx, items }: Tx, tapestryid: number, target: LocationTarget, self: number) {
	const active = await trx('tapestrylocation').where({ tapestryid, active: true }).first();
	const unchanged =
		active &&
		target &&
		active.businesspartnerid === target.bp &&
		(target.bp !== self || (active.locationid === target.location && active.sublocationid === target.sublocation));
	if (unchanged || (!active && !target)) return;

	const service = items('tapestrylocation');
	if (active) await service.updateOne(active.id, { active: false, out: today() });
	if (target) {
		await service.createOne({
			tapestryid,
			businesspartnerid: target.bp,
			locationid: target.location,
			sublocationid: target.sublocation,
			active: true,
			IN: today(),
		});
	}
}

export async function applyOwner({ trx, items }: Tx, tapestryid: number, owner: number | null) {
	const active = await trx('ownership').where({ tapestryid, active: true }).first();
	if ((active?.ownerid ?? null) === owner) return;

	const service = items('ownership');
	if (active) await service.updateOne(active.id, { active: false, dateend: today() });
	if (owner !== null) await service.createOne({ tapestryid, ownerid: owner, active: true, datestart: today() });
}
