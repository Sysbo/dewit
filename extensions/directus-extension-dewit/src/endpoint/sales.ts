import { MANAGER_ONLY, badRequest, count, dateOnly, ensureExists, idParam, integer, notFound, paging, searchTerms, sorting, type Ctx } from './lib';
import { applyOwner, dateString, firstPictures, firstTitle, selfPartnerId, today } from './domain';

const SORT_COLUMNS = {
	inventorynumber: 't.inventorynumber',
	seller: 'seller.name',
	buyer: 'buyer.name',
	minprice: 's.minprice',
	transactionprice: 's.transactionprice',
	saledatestart: 's.saledatestart',
	transactiondate: 's.transactiondate',
};

async function overview({ db, query }: Ctx) {
	const { limit, offset } = paging(query);
	const sold = query.status === 'sold';
	const base = db('salesinformation as s')
		.join('tapestry as t', 't.id', 's.tapestryid')
		.leftJoin('businesspartner as seller', 'seller.id', 's.seller')
		.leftJoin('businesspartner as buyer', 'buyer.id', 's.buyer')
		.where('s.active', !sold);
	if (sold) base.where((b: any) => b.whereNotNull('s.transactiondate').orWhereNotNull('s.buyer').orWhereNotNull('s.transactionprice'));
	for (const term of searchTerms(query.search)) {
		base.where((b: any) => {
			for (const column of ['t.inventorynumber', 't.titlenl', 't.titleen', 't.titlefr', 'seller.name', 'buyer.name']) b.orWhereILike(column, term);
		});
	}

	const total = await count(base);
	const rows = await base
		.clone()
		.select('s.id', 't.id as tapestry', 't.inventorynumber', 't.titlenl', 't.titleen', 't.titlefr', 'seller.name as seller', 'buyer.name as buyer', 's.minprice', 's.transactionprice', 's.saledatestart', 's.transactiondate')
		.orderByRaw(sorting(query, SORT_COLUMNS, sold ? '-transactiondate' : '-saledatestart'))
		.orderBy('s.id', 'desc')
		.limit(limit)
		.offset(offset);
	const thumbnails = await firstPictures(db, rows.map((row: any) => row.tapestry));
	return {
		total,
		items: rows.map((row: any) => ({
			id: row.id,
			tapestry: row.tapestry,
			inventorynumber: row.inventorynumber,
			title: firstTitle(row),
			seller: row.seller,
			buyer: row.buyer,
			minprice: row.minprice,
			transactionprice: row.transactionprice,
			saledatestart: dateString(row.saledatestart),
			transactiondate: dateString(row.transactiondate),
			thumbnail: thumbnails.get(row.tapestry) ?? null,
		})),
	};
}

async function read({ db, params }: Ctx) {
	const tapestryid = idParam(params.tapestryId, 'Tapestry');
	const tapestry = await db('tapestry').where({ id: tapestryid }).first();
	if (!tapestry) throw notFound('Tapestry');
	const thumbnails = await firstPictures(db, [tapestryid]);

	const active = await db('salesinformation').where({ tapestryid, active: true }).first();
	// A sale withdrawn without transaction is inactive but is not a past sale.
	const history = await db('salesinformation as s')
		.leftJoin('businesspartner as seller', 'seller.id', 's.seller')
		.leftJoin('businesspartner as buyer', 'buyer.id', 's.buyer')
		.where({ 's.tapestryid': tapestryid, 's.active': false })
		.where((b: any) => b.whereNotNull('s.transactiondate').orWhereNotNull('s.buyer').orWhereNotNull('s.transactionprice'))
		.orderBy('s.transactiondate', 'desc')
		.orderBy('s.id', 'desc')
		.select('s.id', 'seller.name as soldby', 'buyer.name as soldto', 's.transactiondate', 's.minprice', 's.transactionprice');

	return {
		tapestry: {
			id: tapestryid,
			inventorynumber: tapestry.inventorynumber,
			title: firstTitle(tapestry),
			thumbnail: thumbnails.get(tapestryid) ?? null,
		},
		forsale: Boolean(active),
		seller: active?.seller ?? null,
		minprice: active?.minprice ?? null,
		selfPartner: await selfPartnerId(db),
		history: history.map((row: any) => ({ ...row, transactiondate: dateString(row.transactiondate) })),
	};
}

async function save({ params, body, tx }: Ctx) {
	const tapestryid = idParam(params.tapestryId, 'Tapestry');
	const forsale = body.forsale === true;
	const minprice = integer(body.minprice, 'Minimum price');
	const transactionprice = integer(body.transactionprice, 'Sale price');
	const transactiondate = dateOnly(body.transactiondate, 'Sold on');
	const buyer = integer(body.buyer, 'Sold to');
	const declaredSold = transactionprice !== null || transactiondate !== null || buyer !== null;

	if (!forsale && declaredSold) throw badRequest('Sale details require the For Sale flag');

	return tx(async (t) => {
		const { trx, items } = t;
		// The lock serializes concurrent saves on the same tapestry.
		if (!(await trx('tapestry').where({ id: tapestryid }).forUpdate().first())) throw notFound('Tapestry');

		const sales = items('salesinformation');
		const tapestries = items('tapestry');
		const active = await trx('salesinformation').where({ tapestryid, active: true }).first();

		if (!forsale) {
			if (active) {
				await sales.updateOne(active.id, { active: false });
				await tapestries.updateOne(tapestryid, { forsale: false });
			}
			return { status: active ? 'withdrawn' : 'unchanged' };
		}

		const seller = integer(body.seller, 'Seller') ?? (await selfPartnerId(trx));
		await ensureExists(trx, 'businesspartner', seller, 'Seller');
		await ensureExists(trx, 'businesspartner', buyer, 'Sold to');

		const sold = { transactionprice, transactiondate: transactiondate ?? today(), buyer, active: false };

		if (declaredSold) {
			if (active) await sales.updateOne(active.id, { seller, minprice, ...sold });
			else await sales.createOne({ tapestryid, seller, minprice, saledatestart: today(), ...sold });
			await tapestries.updateOne(tapestryid, { forsale: false });
			if (buyer !== null) await applyOwner(t, tapestryid, buyer);
			return { status: 'sold' };
		}

		if (active) await sales.updateOne(active.id, { seller, minprice });
		else await sales.createOne({ tapestryid, seller, minprice, saledatestart: today(), active: true });
		await tapestries.updateOne(tapestryid, { forsale: true });
		return { status: 'for-sale' };
	});
}

export function registerSales(router: any, route: any) {
	router.get('/sales', route(MANAGER_ONLY, overview));
	router.get('/sales/:tapestryId', route(MANAGER_ONLY, read));
	router.put('/sales/:tapestryId', route(MANAGER_ONLY, save));
}
