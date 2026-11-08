import {
	ALL_ROLES,
	MANAGER_ONLY,
	badRequest,
	blockIfUsed,
	conflict,
	count,
	idList,
	idParam,
	integer,
	likePattern,
	notFound,
	paging,
	requiredText,
	text,
	type Ctx,
	type Tx,
} from './lib';
import { selfPartnerId, selfRelationTypeId, tapestryLabel } from './domain';

async function assertRow(trx: any, table: string, id: number, what: string) {
	if (!(await trx(table).where({ id }).first())) throw notFound(what);
}

// Artists -----------------------------------------------------------------------------------

const parseArtist = (body: any) => ({ name: requiredText(body.name, 'Artist name'), period: text(body.period) });

async function listArtists({ db, query }: Ctx) {
	const { limit, offset } = paging(query);
	const base = db('artist as a');
	const search = text(query.search);
	if (search) base.where((b: any) => b.whereILike('a.name', likePattern(search)).orWhereILike('a.period', likePattern(search)));
	const total = await count(base);
	const items = await base
		.clone()
		.select('a.id', 'a.name', 'a.period', db('tapestry as t').count('*').whereRaw('t.artist = a.id').as('tapestries'))
		.orderBy('a.name')
		.limit(limit)
		.offset(offset);
	return { total, items: items.map((row: any) => ({ ...row, tapestries: Number(row.tapestries) })) };
}

async function getArtist({ db, params }: Ctx) {
	const id = idParam(params.id, 'Artist');
	const artist = await db('artist').where({ id }).first();
	if (!artist) throw notFound('Artist');
	const tapestries = await db('tapestry').where({ artist: id }).orderBy('inventorynumber');
	return { ...artist, tapestries: tapestries.map((row: any) => ({ id: row.id, label: tapestryLabel(row) })) };
}

// Catalogs ----------------------------------------------------------------------------------

function parseCatalog(body: any) {
	const year = integer(body.year, 'Year');
	if (year === null || year < 1000 || year > 9999) throw badRequest('Year is required (for example 2026)');
	return { name: requiredText(body.name, 'Catalog name'), year };
}

async function listCatalogs({ db, query }: Ctx) {
	const { limit, offset } = paging(query);
	const base = db('catalogue as c');
	const search = text(query.search);
	if (search) base.whereILike('c.name', likePattern(search));
	const total = await count(base);
	const items = await base
		.clone()
		.select('c.id', 'c.name', 'c.year', db('cataloguepresence as p').count('*').whereRaw('p.catalogueid = c.id').as('tapestries'))
		.orderBy([{ column: 'c.year', order: 'desc' }, { column: 'c.name' }])
		.limit(limit)
		.offset(offset);
	return { total, items: items.map((row: any) => ({ ...row, tapestries: Number(row.tapestries) })) };
}

async function getCatalog({ db, params }: Ctx) {
	const id = idParam(params.id, 'Catalog');
	const catalog = await db('catalogue').where({ id }).first('id', 'name', 'year');
	if (!catalog) throw notFound('Catalog');
	const rows = await db('cataloguepresence as p')
		.join('tapestry as t', 't.id', 'p.tapestryid')
		.where('p.catalogueid', id)
		.orderBy('t.inventorynumber')
		.select('t.id', 't.inventorynumber', 't.titlenl', 't.titleen', 't.titlefr');
	return { ...catalog, tapestries: rows.map((row: any) => ({ id: row.id, label: tapestryLabel(row) })) };
}

// Only the difference is written, so catalogprice survives on rows that stay assigned.
async function syncCatalogTapestries({ trx, items }: Tx, catalogueid: number, tapestryIds: number[]) {
	if (tapestryIds.length) {
		const known = await trx('tapestry').whereIn('id', tapestryIds).select('id');
		if (known.length !== tapestryIds.length) throw badRequest('A selected tapestry does not exist');
	}
	const current = await trx('cataloguepresence').where({ catalogueid });
	const service = items('cataloguepresence');
	const removed = current.filter((row: any) => !tapestryIds.includes(row.tapestryid)).map((row: any) => row.id);
	if (removed.length) await service.deleteMany(removed);
	for (const tapestryid of tapestryIds) {
		if (!current.some((row: any) => row.tapestryid === tapestryid)) await service.createOne({ catalogueid, tapestryid });
	}
}

// Business partners -------------------------------------------------------------------------

function parsePartner(body: any) {
	return {
		name: requiredText(body.name, 'Name'),
		addressstreet: text(body.addressstreet),
		addressnr: text(body.addressnr),
		addresstown: text(body.addresstown),
		addresscountry: text(body.addresscountry),
		active: body.active !== false,
	};
}

async function listPartners({ db, query }: Ctx) {
	const { limit, offset } = paging(query);
	const base = db('businesspartner as p');
	const search = text(query.search);
	if (search) {
		const pattern = likePattern(search);
		base.where((b: any) => b.whereILike('p.name', pattern).orWhereILike('p.addresstown', pattern).orWhereILike('p.addresscountry', pattern));
	}
	const total = await count(base);
	const rows = await base.clone().select('p.id', 'p.name', 'p.addresstown', 'p.addresscountry', 'p.active').orderBy('p.name').limit(limit).offset(offset);
	const ids = rows.map((row: any) => row.id);
	const relations = ids.length
		? await db('bprelationship as r').join('relationtype as t', 't.id', 'r.relationtypeid').whereIn('r.businesspartnerid', ids).select('r.businesspartnerid', 't.name')
		: [];
	return {
		total,
		items: rows.map((row: any) => ({
			...row,
			activeLabel: row.active ? 'Yes' : 'No',
			types: relations.filter((r: any) => r.businesspartnerid === row.id).map((r: any) => r.name).join(', '),
		})),
	};
}

async function getPartner({ db, params }: Ctx) {
	const id = idParam(params.id, 'Business partner');
	const partner = await db('businesspartner').where({ id }).first();
	if (!partner) throw notFound('Business partner');
	const relations = await db('bprelationship').where({ businesspartnerid: id }).select('relationtypeid');
	const selfType = await selfRelationTypeId(db);
	const types = relations.map((row: any) => row.relationtypeid);
	return { ...partner, isSelf: types.includes(selfType), types: types.filter((type: number) => type !== selfType) };
}

// SELF can never be assigned or removed here, which keeps DeWit as the only SELF partner.
async function syncPartnerTypes({ trx, items }: Tx, businesspartnerid: number, types: number[]) {
	const selfType = await selfRelationTypeId(trx);
	if (types.includes(selfType)) throw badRequest('Only DeWit can be SELF');
	if (types.length) {
		const known = await trx('relationtype').whereIn('id', types).select('id');
		if (known.length !== types.length) throw badRequest('A selected type does not exist');
	}
	const current = (await trx('bprelationship').where({ businesspartnerid })).filter((row: any) => row.relationtypeid !== selfType);
	const service = items('bprelationship');
	const removed = current.filter((row: any) => !types.includes(row.relationtypeid)).map((row: any) => row.id);
	if (removed.length) await service.deleteMany(removed);
	for (const relationtypeid of types) {
		if (!current.some((row: any) => row.relationtypeid === relationtypeid)) await service.createOne({ businesspartnerid, relationtypeid });
	}
}

async function removePartner({ params, tx }: Ctx) {
	const id = idParam(params.id, 'Business partner');
	return tx(async ({ trx, items }) => {
		await assertRow(trx, 'businesspartner', id, 'Business partner');
		if (id === (await selfPartnerId(trx))) throw conflict('DeWit (SELF) cannot be deleted');
		await blockIfUsed(
			trx,
			[
				['ownership', 'ownerid', 'ownerships'],
				['tapestrylocation', 'businesspartnerid', 'tapestry locations'],
				['salesinformation', 'seller', 'sales'],
				['salesinformation', 'buyer', 'sales'],
				['location', 'bpid', 'locations'],
			],
			id,
		);
		const keys = (await trx('bprelationship').where({ businesspartnerid: id }).select('id')).map((row: any) => row.id);
		if (keys.length) await items('bprelationship').deleteMany(keys);
		await items('businesspartner').deleteOne(id);
		return { id };
	});
}

// Orientations ------------------------------------------------------------------------------

const parseOrientation = (body: any) => ({ name: requiredText(body.name, 'Orientation') });

async function listOrientations({ db }: Ctx) {
	const items = await db('orientation').select('id', 'name').orderBy('name');
	return { total: items.length, items };
}

// Options used by the form dropdowns ---------------------------------------------------------

async function formOptions({ db, role }: Ctx) {
	const self = await selfPartnerId(db);
	const [artists, orientations, partners, locations, sublocations, relationTypes] = await Promise.all([
		db('artist').select('id', 'name', 'period').orderBy('name'),
		db('orientation').select('id', 'name').orderBy('name'),
		db('businesspartner').select('id', 'name', 'active').orderBy('name'),
		db('location').where({ bpid: self }).select('id', 'name').orderBy('name'),
		db('sublocation as s').join('location as l', 'l.id', 's.locationid').where('l.bpid', self).select('s.id', 's.locationid', 's.description').orderBy('s.description'),
		role === 'manager' ? db('relationtype').whereRaw('lower(name) <> ?', ['self']).select('id', 'name').orderBy('name') : [],
	]);
	return { selfPartner: self, artists, orientations, partners, locations, sublocations, relationTypes };
}

// Routes --------------------------------------------------------------------------------------

export function registerReferences(router: any, route: any) {
	router.get('/me', route(ALL_ROLES, async ({ role }: Ctx) => ({ role })));
	router.get('/options', route(ALL_ROLES, formOptions));

	router.get('/artists', route(ALL_ROLES, listArtists));
	router.get('/artists/:id', route(ALL_ROLES, getArtist));
	router.post('/artists', route(ALL_ROLES, async ({ body, tx }: Ctx) => {
		const values = parseArtist(body);
		return tx(async ({ items }) => ({ id: await items('artist').createOne(values) }));
	}));
	router.patch('/artists/:id', route(ALL_ROLES, async ({ params, body, tx }: Ctx) => {
		const id = idParam(params.id, 'Artist');
		const values = parseArtist(body);
		return tx(async ({ trx, items }) => {
			await assertRow(trx, 'artist', id, 'Artist');
			await items('artist').updateOne(id, values);
			return { id };
		});
	}));
	router.delete('/artists/:id', route(MANAGER_ONLY, async ({ params, tx }: Ctx) => {
		const id = idParam(params.id, 'Artist');
		return tx(async ({ trx, items }) => {
			await assertRow(trx, 'artist', id, 'Artist');
			await blockIfUsed(trx, [['tapestry', 'artist', 'tapestries']], id);
			await items('artist').deleteOne(id);
			return { id };
		});
	}));

	router.get('/catalogs', route(ALL_ROLES, listCatalogs));
	router.get('/catalogs/:id', route(ALL_ROLES, getCatalog));
	router.post('/catalogs', route(MANAGER_ONLY, async ({ body, tx }: Ctx) => {
		const values = parseCatalog(body);
		const tapestries = idList(body.tapestries, 'Tapestries');
		return tx(async (t) => {
			const id = await t.items('catalogue').createOne(values);
			await syncCatalogTapestries(t, id, tapestries);
			return { id };
		});
	}));
	router.patch('/catalogs/:id', route(MANAGER_ONLY, async ({ params, body, tx }: Ctx) => {
		const id = idParam(params.id, 'Catalog');
		const values = parseCatalog(body);
		const tapestries = idList(body.tapestries, 'Tapestries');
		return tx(async (t) => {
			await assertRow(t.trx, 'catalogue', id, 'Catalog');
			await t.items('catalogue').updateOne(id, values);
			await syncCatalogTapestries(t, id, tapestries);
			return { id };
		});
	}));
	router.delete('/catalogs/:id', route(MANAGER_ONLY, async ({ params, tx }: Ctx) => {
		const id = idParam(params.id, 'Catalog');
		return tx(async ({ trx, items }) => {
			await assertRow(trx, 'catalogue', id, 'Catalog');
			await blockIfUsed(trx, [['cataloguepresence', 'catalogueid', 'tapestries']], id);
			await items('catalogue').deleteOne(id);
			return { id };
		});
	}));

	router.get('/partners', route(ALL_ROLES, listPartners));
	router.get('/partners/:id', route(ALL_ROLES, getPartner));
	router.post('/partners', route(MANAGER_ONLY, async ({ body, tx }: Ctx) => {
		const values = parsePartner(body);
		const types = idList(body.types, 'Type');
		return tx(async (t) => {
			const id = await t.items('businesspartner').createOne(values);
			await syncPartnerTypes(t, id, types);
			return { id };
		});
	}));
	router.patch('/partners/:id', route(MANAGER_ONLY, async ({ params, body, tx }: Ctx) => {
		const id = idParam(params.id, 'Business partner');
		const values = parsePartner(body);
		const types = idList(body.types, 'Type');
		return tx(async (t) => {
			await assertRow(t.trx, 'businesspartner', id, 'Business partner');
			await t.items('businesspartner').updateOne(id, values);
			await syncPartnerTypes(t, id, types);
			return { id };
		});
	}));
	router.delete('/partners/:id', route(MANAGER_ONLY, removePartner));

	router.get('/orientations', route(MANAGER_ONLY, listOrientations));
	router.get('/orientations/:id', route(MANAGER_ONLY, async ({ db, params }: Ctx) => {
		const row = await db('orientation').where({ id: idParam(params.id, 'Orientation') }).first();
		if (!row) throw notFound('Orientation');
		return row;
	}));
	router.post('/orientations', route(MANAGER_ONLY, async ({ body, tx }: Ctx) => {
		const values = parseOrientation(body);
		return tx(async ({ items }) => ({ id: await items('orientation').createOne(values) }));
	}));
	router.patch('/orientations/:id', route(MANAGER_ONLY, async ({ params, body, tx }: Ctx) => {
		const id = idParam(params.id, 'Orientation');
		const values = parseOrientation(body);
		return tx(async ({ trx, items }) => {
			await assertRow(trx, 'orientation', id, 'Orientation');
			await items('orientation').updateOne(id, values);
			return { id };
		});
	}));
	router.delete('/orientations/:id', route(MANAGER_ONLY, async ({ params, tx }: Ctx) => {
		const id = idParam(params.id, 'Orientation');
		return tx(async ({ trx, items }) => {
			await assertRow(trx, 'orientation', id, 'Orientation');
			await blockIfUsed(trx, [['tapestry', 'orientation', 'tapestries']], id);
			await items('orientation').deleteOne(id);
			return { id };
		});
	}));
}
