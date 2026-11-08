"""Génère db/insights/business_dashboard.sql : dashboard Insights « Tableau de bord commercial ».

Les dashboards Directus sont des données (directus_dashboards / directus_panels), pas du schéma :
ils ne sont pas couverts par snapshots/snapshot.yaml. Ce script produit un SQL idempotent
(supprime puis recrée le dashboard à UUID fixe) rejouable sur n'importe quelle instance.

    python3 db/insights/generate_business_dashboard.py
"""
import json
from pathlib import Path

DASHBOARD_ID = "5d3f0a8e-7c1b-4d2a-9e6f-0b1c2d3e4f50"
DEWIT_BP_ID = 1  # businesspartner « Manufacture DeWit »

EUR = {"numberStyle": "currency", "unit": "EUR", "notation": "standard",
       "minimumFractionDigits": 0, "maximumFractionDigits": 0}

sold_by_dewit = {"_and": [{"seller": {"_eq": DEWIT_BP_ID}}, {"transactiondate": {"_nnull": True}}]}
bought_by_dewit = {"_and": [{"buyer": {"_eq": DEWIT_BP_ID}}, {"transactiondate": {"_nnull": True}}]}
on_sale = {"active": {"_eq": True}}
owned_by_dewit = {"_and": [{"active": {"_eq": True}}, {"ownerid": {"_eq": DEWIT_BP_ID}}]}

panels = []


def panel(type_, x, y, w, h, options, name=None, icon=None, note=None, color=None):
    panels.append(dict(type=type_, position_x=x, position_y=y, width=w, height=h, options=options,
                       name=name, icon=icon, note=note, color=color, show_header=name is not None))


def section(y, text):
    panel("label", 1, y, 60, 3, {"text": text, "fontSize": "1.8125rem", "fontWeight": 700, "textAlign": "start",
                                  "color": "var(--theme--foreground)"})


def metric(x, y, name, icon, collection, fn, field, filter_=None, extra=None, note=None):
    options = {"collection": collection, "function": fn, "field": field, "numberStyle": "decimal",
               "notation": "standard", "minimumFractionDigits": 0, "maximumFractionDigits": 0,
               "textAlign": "center", "fontSize": "auto", "fontWeight": 700}
    if filter_:
        options["filter"] = filter_
    options.update(extra or {})
    panel("metric", x, y, 12, 6, options, name, icon, note)


def bar(x, y, w, name, icon, collection, x_axis, y_axis="id", fn="count", display=None, filter_=None,
        horizontal=True, note=None):
    options = {"collection": collection, "xAxis": x_axis, "yAxis": y_axis, "function": fn, "horizontal": horizontal,
               "decimals": 0, "showAxisLabels": "both", "showDataLabel": True, "color": "var(--theme--primary)",
               "filter": filter_ or {}}
    if display:
        options["xAxisDisplayField"] = display
    panel("bar-chart", x, y, w, 14, options, name, icon, note)


def list_(x, y, w, h, name, icon, collection, template, sort_field, direction="desc", filter_=None, limit=8,
          note=None):
    panel("list", x, y, w, h, {"collection": collection, "displayTemplate": template, "sortField": sort_field,
                               "sortDirection": direction, "limit": limit, "linkToItem": True,
                               "filter": filter_ or {}}, name, icon, note)


# ---------------------------------------------------------------- Ventes
section(1, "Ventes")
metric(1, 4, "Chiffre d'affaires", "payments", "salesinformation", "sum", "transactionprice", sold_by_dewit, EUR,
       "Somme des prix de transaction des ventes conclues par DeWit")
metric(13, 4, "Ventes conclues", "handshake", "salesinformation", "count", "id", sold_by_dewit)
metric(25, 4, "Prix de vente moyen", "calculate", "salesinformation", "avg", "transactionprice", sold_by_dewit, EUR)
metric(37, 4, "Tapisseries en vente", "sell", "salesinformation", "count", "id", on_sale,
       note="Fiches de vente actives")
metric(49, 4, "Prix plancher en vente", "price_check", "salesinformation", "sum", "minprice", on_sale, EUR,
       "Somme des prix minimum des ventes actives")

panel("time-series", 1, 10, 30, 14, {
    "collection": "salesinformation", "dateField": "transactiondate", "valueField": "transactionprice",
    "function": "sum", "precision": "year", "range": "auto", "decimals": 0, "curveType": "smooth",
    "color": "var(--theme--primary)", "filter": json.dumps(sold_by_dewit),
}, "Chiffre d'affaires par année", "timeline")
list_(31, 10, 30, 14, "Ventes en cours (plus anciennes d'abord)", "hourglass_bottom", "salesinformation",
      "{{tapestryid.inventorynumber}} · min. {{minprice}} € · depuis le {{saledatestart}}", "saledatestart", "asc",
      on_sale, note="Tapisseries en vente depuis le plus longtemps")

list_(1, 24, 30, 12, "Dernières ventes conclues", "receipt_long", "salesinformation",
      "{{transactiondate}} · {{tapestryid.inventorynumber}} → {{buyer.name}} · {{transactionprice}} €",
      "transactiondate", "desc", sold_by_dewit)
list_(31, 24, 30, 12, "Dernières acquisitions", "shopping_bag", "salesinformation",
      "{{transactiondate}} · {{tapestryid.inventorynumber}} ← {{seller.name}} · {{transactionprice}} €",
      "transactiondate", "desc", bought_by_dewit)

# ---------------------------------------------------------------- Inventaire
section(36, "Inventaire")
metric(1, 39, "Tapisseries répertoriées", "inventory_2", "tapestry", "count", "id")
metric(13, 39, "Détenues par DeWit", "home_work", "ownership", "count", "id", owned_by_dewit)
metric(25, 39, "Chez des tiers", "groups", "ownership", "count", "id",
       {"_and": [{"active": {"_eq": True}}, {"ownerid": {"_neq": DEWIT_BP_ID}}]},
       note="Propriétaire actuel autre que DeWit")
metric(37, 39, "Marquées « à vendre »", "local_offer", "tapestry", "count", "id", {"forsale": {"_eq": True}})
metric(49, 39, "Surface détenue", "straighten", "tapestry", "sum", "surface",
       {"ownerships": {"_some": owned_by_dewit}}, {"suffix": " m²", "maximumFractionDigits": 1},
       "Surface totale des tapisseries appartenant à DeWit")

bar(1, 45, 30, "Tapisseries par artiste", "palette", "tapestry", "artist", display="name")
panel("pie-chart", 31, 45, 30, 14, {"collection": "tapestry", "column": "type", "function": "count", "donut": True,
                                    "showLabels": True, "legend": "right", "decimals": 0, "filter": {}},
      "Répartition par type", "donut_small")

bar(1, 59, 20, "Par siècle", "history_edu", "tapestry", "century", horizontal=False)
bar(21, 59, 20, "Stock DeWit par emplacement", "warehouse", "tapestrylocation", "locationid", display="name",
    filter_={"_and": [{"businesspartnerid": {"_eq": DEWIT_BP_ID}}, {"out": {"_null": True}}]},
    note="Emplacement actuel (sans date de sortie) des tapisseries stockées chez DeWit")
bar(41, 59, 20, "Par propriétaire actuel", "badge", "ownership", "ownerid", display="name",
    filter_={"active": {"_eq": True}})

# ---------------------------------------------------------------- Salons & catalogues
section(73, "Salons & catalogues")
bar(1, 76, 20, "Tapisseries présentées par salon", "storefront", "cataloguepresence", "catalogueid", display="name")
bar(21, 76, 20, "Valeur catalogue par salon", "euro", "cataloguepresence", "catalogueid", "catalogprice", "sum",
    display="name", note="Somme des prix catalogue (€)")
list_(41, 76, 20, 14, "Prochains salons", "event", "catalogue", "{{name}} · {{datestart}} → {{dateend}}",
      "datestart", "asc", {"dateend": {"_gte": "$NOW"}})

# ---------------------------------------------------------------- Entretien
section(90, "Entretien")
metric(1, 93, "Nettoyages (12 mois)", "cleaning_services", "cleaning", "count", "id",
       {"datecleaning": {"_gte": "$NOW(-1 year)"}})
list_(13, 93, 30, 10, "Derniers nettoyages", "history", "cleaning",
      "{{datecleaning}} · {{tapestryid.inventorynumber}} · {{comments}}", "datecleaning", "desc")


def sql_str(value):
    return "NULL" if value is None else "'" + str(value).replace("'", "''") + "'"


lines = [
    "-- Généré par db/insights/generate_business_dashboard.py — ne pas éditer à la main.",
    "-- Dashboard Insights « Tableau de bord commercial ». Idempotent : supprime puis recrée le dashboard.",
    "BEGIN;",
    f"DELETE FROM directus_dashboards WHERE id = '{DASHBOARD_ID}';",
    "INSERT INTO directus_dashboards (id, name, icon, note, color) VALUES "
    f"('{DASHBOARD_ID}', 'Tableau de bord commercial', 'monitoring', "
    "'Ventes, inventaire, salons et entretien des tapisseries', '#6644FF');",
]
for p in panels:
    lines.append(
        "INSERT INTO directus_panels (id, dashboard, name, icon, color, show_header, note, type, "
        "position_x, position_y, width, height, options) VALUES (gen_random_uuid(), "
        f"'{DASHBOARD_ID}', {sql_str(p['name'])}, {sql_str(p['icon'])}, {sql_str(p['color'])}, "
        f"{str(p['show_header']).lower()}, {sql_str(p['note'])}, '{p['type']}', {p['position_x']}, "
        f"{p['position_y']}, {p['width']}, {p['height']}, {sql_str(json.dumps(p['options'], ensure_ascii=False))});"
    )
lines.append("COMMIT;")

out = Path(__file__).with_name("business_dashboard.sql")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"{out} : {len(panels)} panels")
