-- Test/sample data extracted from LatestVersionDewitDBPlusInserts.xlsx
-- Used to validate the DeWit schema's structure (constraints, FKs, types).

BEGIN;


-- InsArtists
INSERT INTO public.artist(name, period) VALUES ('Hennequin de Bruges', '1368-1381');
INSERT INTO public.artist(name, period) VALUES ('Nicolas Bataille', '1363-1400');
INSERT INTO public.artist(name, period) VALUES ('Robert Campin dit ''Le Maître de Flémalle''', '1378-1444');
INSERT INTO public.artist(name, period) VALUES ('Jean Grenier', '1450-1480');
INSERT INTO public.artist(name, period) VALUES ('Pasquier Grenier', 'XVe siècle');
INSERT INTO public.artist(name, period) VALUES ('Le Maître de Anne de Bretagne', 'XV-XVIe siècle (1490-1508)');
INSERT INTO public.artist(name, period) VALUES ('Antoine de Lonhy', '1446-1490');
INSERT INTO public.artist(name, period) VALUES ('Pieter van Aelst dit Pierre d''Enghien', 'XV-XVIe siècle (Mort en 1532)');

-- InsOrientation
INSERT INTO public.orientation(name) VALUES ('Vertical');
INSERT INTO public.orientation(name) VALUES ('Horizontal');
INSERT INTO public.orientation(name) VALUES ('Other');

-- InsBP
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('Manufacture DeWit', 'Rue de la manufacture', '1', 'Belgium', 'Malines', 'TRUE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('SASPJ Plaza Hotton', 'Rue Simon', '14', 'Belgium', 'Hotton', 'TRUE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('SA Olivier & Co', 'Allée du Monument', '11', 'France', 'Le Tholy', 'TRUE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('SPRL Bruno Thai Store', 'Rue des Ecoles', '109', 'Italy', 'Bergame', 'FALSE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('SRL Permaplants', 'Rue quelque part', '7', 'Belgium', 'Spa', 'TRUE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('ASBL Open Source Music', 'Rue des Sarts', '200', 'Spain', 'Madrid', 'TRUE');
INSERT INTO public.businesspartner(name, addressstreet, addressnr, addresscountry, addresstown, active) VALUES ('Random Partner', 'Jump Street', '21', 'United States', 'Akron', 'TRUE');

-- InsRelType
INSERT INTO public.relationtype(name) VALUES ('Customer');
INSERT INTO public.relationtype(name) VALUES ('Supplier');
INSERT INTO public.relationtype(name) VALUES ('Partner');
INSERT INTO public.relationtype(name) VALUES ('N/A');

-- InsBPRelationship
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (4, 1);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (3, 2);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (1, 3);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (2, 4);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (2, 5);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (3, 6);
INSERT INTO public.bprelationship(relationtypeid, businesspartnerid) VALUES (3, 7);

-- InsLocation
INSERT INTO public.location(bpid, name, countryinformation) VALUES (1, 'Salle de stockage 01', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (1, 'Salle de nettoyage', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (1, 'Salle de stockage 02', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (1, 'Sous-sols', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (1, 'Grenier 01', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (2, 'Entrepot Plaza Hotton', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (5, 'Entrepot Permaplants', 'Belgium');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (6, 'Entrepot OSM', 'Spain');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (3, 'Entrepot Olivier', 'France');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (4, 'Thai Store', 'Italy');
INSERT INTO public.location(bpid, name, countryinformation) VALUES (7, 'Random zone', 'United States');

-- InsSubLoc
INSERT INTO public.sublocation(locationid, description) VALUES (1, 'Etagère 1');
INSERT INTO public.sublocation(locationid, description) VALUES (1, 'Etagère 2');
INSERT INTO public.sublocation(locationid, description) VALUES (2, 'Armoire 1');
INSERT INTO public.sublocation(locationid, description) VALUES (2, 'Armoire 2');
INSERT INTO public.sublocation(locationid, description) VALUES (3, 'Etagère 1');
INSERT INTO public.sublocation(locationid, description) VALUES (3, 'Etagère 2');
INSERT INTO public.sublocation(locationid, description) VALUES (3, 'Coffre 1');
INSERT INTO public.sublocation(locationid, description) VALUES (3, 'Coffre 2');
INSERT INTO public.sublocation(locationid, description) VALUES (4, 'Boite hermétique 1');
INSERT INTO public.sublocation(locationid, description) VALUES (4, 'Boite hermétique 2');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Etagère suspendue');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Etagère murale 1');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Etagère murale 2');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Coffre mural 1');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Coffre mural 2');
INSERT INTO public.sublocation(locationid, description) VALUES (5, 'Coffre mural 3');

-- InsCatalog
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('BRAFA 2025', '2025-02-01', '2025-02-08');
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('BRAFA 2026', '2026-03-01', '2026-03-08');
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('BRAFA 2027', '2027-02-15', '2027-02-22');
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('TEFAF 2025', '2025-07-15', '2025-07-22');
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('TEFAF 2026', '2026-08-01', '2026-08-08');
INSERT INTO public.catalogue(name, datestart, dateend) VALUES ('TEFAF 2027', '2027-10-01', '2027-10-08');

-- InsPictures
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\CHES.png', 'PNG', 'CHES', 'Schéma d''orientation et de mesures pour cadre.', 'Julien Pahaut');
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\Fleur.jpg', 'JPG', 'Fleur', 'Une fleur de courgettes ou de cucurbitacés.', 'Probablement Julien Pahaut');
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\Forest.jpg', 'JPG', 'Forest', 'Une forêt vosgienne.', 'Un promeneur dans les Vosges');
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\Graffiti.png', 'PNG', 'Graffiti', 'Un titre coloré', 'Random user');
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\Head.png', 'PNG', 'Head', 'Une tête dans un dessin animé', 'Personne');
INSERT INTO public.picture(path, mimetype, name, description, descriptionauthor) VALUES ('C:\TempPictures\Lizard.jpg', 'JPG', 'Lizard', 'Un lézard espagnol.', 'Julien Pahaut');

-- InsTapestry
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (1, 2, 'XXXX-12345', 'Hofscène', 14, NULL, '2008', 'Musée du Louvres', 2.5, 6, 15, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, '4', 'The court of King Louis XIV', 'Het hof van koning Lodewijk XIV', 'La cour du roi Louis XIV', 'Julien Pahaut', 'Big Lou', 'Dikke lodewijk', 'Le gros Louis');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (2, 2, 'YYYY-12345', 'Millefleurs', 14, NULL, '2020', 'Collection privée d''un concurrent', 2.8, 4, 11.2, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, '25', 'Thousands of colorful flowers', 'Duizenden kleurrijke bloemen', 'Des millieurs de fleurs colorées', 'Julien Pahaut', 'Captured Bloom', 'Stilstaand groen', 'Pot de fleurs');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (3, 1, 'XXXX-123456', 'Verdure', 15, NULL, '2012', 'Cave d''un particulier', 1.6, 1.2, 1.92, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, '', 'A forest in England', 'Een bos in Engeland', 'Une forêt en Angleterre', 'Pierre Maes', 'Dark Canopy', 'Schaduwwoud', 'Forêt noire');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (4, 2, 'XXXX-1234567', 'Mythologie', 15, NULL, '2011', 'Trouvée dans les bois', 2.6, 4.4, 11.44, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, '66', 'Greek gods at war', 'Strijdende Griekse goden', 'Les dieux grecs en guerre', 'Pierre Maes', 'Wrath from above', 'Hemelse storm', 'Colère des dieux');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (5, 2, 'YYYY-123456', 'Bijbels', 15, NULL, '2011', 'Récupérée sur une brocante', 3, 5.2, 15.6, FALSE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE, '', 'An episode from the New Testament', 'Een tafereel uit het Nieuwe Testament', 'Un épisode du nouveau testament', 'Pierre Maes', 'The next Era', 'Dageraad van Morgen', 'Le nouveau testament revisité');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (6, 1, 'AAAA-12345', 'Mythologie', 15, NULL, '2006', 'Château de Bouillon', 1.4, 1.2, 1.68, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, '', 'Roman gods facing mankind', 'Romeinse goden en de mensheid', 'Les dieux romains face aux hommes', 'Stéphane Maes', 'Empire''s echoes', 'Oude overheersers', 'Les Romains face aux Dieux');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (7, 1, 'CCCC-12345', 'Teniers', 15, NULL, '2024', 'École des arts de Liège', 2, 1.8, 3.6, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, TRUE, '12', 'An everyday scene from the Middle Ages', 'Een alledaags tafereel uit de middeleeuwen', 'Une scène du quotidien durant le moyen âge', 'Stéphane Maes', 'Pass the seasoning', 'Aan Tafel', 'Passe la vinasse');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (8, 2, 'YYYY-1234567', 'Verdure', 16, NULL, '2019', 'Origine inconnue', 3.2, 4.9, 15.68, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, '11', 'Nature in all its splendor', 'De natuur in al haar pracht', 'La nature dans toute sa splendeur', 'Stéphane Maes', 'Pure admiration', 'Zuivere Bewondering', 'Quelle belle pomme');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (3, 3, 'AAAA-123456', 'Bijbels', 15, NULL, '2017', 'Château en Roumanie', 3, 3, 9, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, '', 'Genesis, Adam and Eve', 'Genesis, Adam en Eva', 'La genèse, Adam et Eve', 'Julien Pahaut', 'Garden''s secret', 'Het Derde Element', 'Adam, Eve, et leur serpent');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (5, 1, 'CCCC-123456', 'Hofscène', 15, NULL, '1997', 'Achetée à un particulier', 1.4, 1.2, 1.68, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, '2', 'A king''s army defending his castle', 'Het leger van een koning dat zijn kasteel verdedigt', 'L''armée d''un roi défendant son château', 'Stéphane Maes', 'Full speed ahead', 'Voorwaarts!', 'Chargez');
INSERT INTO public.tapestry(artist, orientation, inventorynumber, type, century, date, conservation, origin, height, width, surface, fragment, forsale, velcro, lining, privatecollection, definitivesize, label, edition, descriptionen, descriptionnl, descriptionfr, descriptionauthor, titleen, titlenl, titlefr) VALUES (7, 2, 'CCCC-1234567', '', 15, NULL, '2001', 'Achetée à une vente aux enchères', 5, 7, 35, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, '104', 'A dog race at a castle', 'Een hondenrace bij een kasteel', 'Une course de chiens dans un château', 'Julien Pahaut', 'Fate''s roll', 'De Inzet is Gemaakt', 'Les paris sont ouverts');

-- InsTapestryLocation
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (1, 1, 1, 2, TRUE, '2000-10-30', NULL, 'Acheté par Dewit, stocké dans stockage étagère 2');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (2, 4, 10, NULL, TRUE, '2007-05-14', NULL, 'Acheté par Thai Store');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (3, 1, 2, 3, FALSE, '1985-01-09', '2024-06-04', 'Acheté par Dewit, stocké dans nettoyage - armoire 1 jusqu''à la vente le 4 juin 2024');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (4, 2, 6, NULL, TRUE, '1997-05-05', NULL, 'Acheté par Plaza Hotton, stocké dans entrepot');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (5, 1, 3, 6, TRUE, '2001-12-25', NULL, 'Acheté par Dewit, stocké dans stockage 02, Etagère 2');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (6, 1, 4, 9, TRUE, '2008-11-01', NULL, 'Acheté par Dewit, stocké dans sous sols, boite hermétique 1');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (7, 1, 5, 12, TRUE, '2026-08-09', NULL, 'Acheté par Dewit, stocké dans Grenier 01, étagère murale 1');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (8, 5, 7, NULL, TRUE, '2015-04-01', NULL, 'Acheté par permaplants, stocké dans entrepot permaplants');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (9, 7, 11, NULL, TRUE, '2011-05-01', NULL, 'Acheté par random, stocké dans random zone');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (10, 3, 9, NULL, TRUE, '1993-06-15', NULL, 'Acheté par Olivier, stocké dans entrepot olivier');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (11, 6, 8, NULL, FALSE, '1999-01-01', '2020-01-01', 'Acheté par OSM, stocké dans entrepot OSM jusqu''à la vente le 1er janvier 2020');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (11, 1, 3, 8, TRUE, '2020-01-02', '2021-06-06', 'Acheté par Dewit à OSM le 2 janvier 2020, stocké dans stockage 02, coffre 2 jusqu''au 6 juin 2021');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (3, 7, 11, NULL, TRUE, '2024-06-05', NULL, 'Acheté par random, stocké dans random zone');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (11, 1, 3, 5, TRUE, '2021-06-06', '2022-09-15', 'Déplacé en interne depuis stockage 02 coffre 2 vers stockage 02 étagère 1 le 6 juin 2021, jusqu''au 15 septembre 2022');
INSERT INTO public.tapestrylocation(tapestryid, businesspartnerid, locationid, sublocationid, active, "IN", out, comments) VALUES (11, 1, 3, 7, TRUE, '2022-09-15', NULL, 'Déplacé en interne depuis stockage 02 étagère 1 vers stockage 02 coffre 1 le 15 juin 2022');

-- InsOwnership
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 1, '2000-10-30', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (4, 2, '2007-05-14', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 3, '1985-01-09', '2024-06-04', FALSE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (2, 4, '1997-05-05', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 5, '2001-12-25', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 6, '2008-11-01', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 7, '2026-08-09', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (5, 8, '2015-04-01', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (7, 9, '2011-05-01', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (3, 10, '1993-06-15', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (6, 11, '1999-01-01', '2020-01-01', FALSE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (1, 11, '2020-01-02', NULL, TRUE);
INSERT INTO public.ownership(ownerid, tapestryid, datestart, dateend, active) VALUES (7, 3, '2024-06-05', NULL, TRUE);

-- InsSalesInformation
INSERT INTO public.salesinformation(seller, buyer, tapestryid, minprice, transactiondate, saledatestart, active, transactionprice) VALUES (1, 7, 3, 100000, '2024-06-04', '1990-06-01', FALSE, 259999);
INSERT INTO public.salesinformation(seller, buyer, tapestryid, minprice, transactiondate, saledatestart, active, transactionprice) VALUES (6, 1, 11, NULL, '2020-01-02', NULL, FALSE, 125000);
INSERT INTO public.salesinformation(seller, buyer, tapestryid, minprice, transactiondate, saledatestart, active, transactionprice) VALUES (1, NULL, 6, 800000, NULL, '2008-11-30', TRUE, NULL);
INSERT INTO public.salesinformation(seller, buyer, tapestryid, minprice, transactiondate, saledatestart, active, transactionprice) VALUES (1, NULL, 7, 220000, NULL, '2026-09-15', TRUE, NULL);

-- InsTapestryPicture
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 1, 1, TRUE, '2018-01-01', TRUE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 2, 2, TRUE, '2019-02-02', FALSE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 3, 3, TRUE, '2020-03-03', FALSE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 4, 4, FALSE, '2020-12-25', TRUE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 8, 5, TRUE, '2021-04-04', FALSE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 10, 6, TRUE, '2022-05-05', TRUE);
INSERT INTO public.tapestrypicture(tapestryid, pictureid, active, dateinformation, uv) VALUES ( 11, 4, TRUE, '2023-06-06', TRUE);

-- InsCataloguePresence
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (1, 3, 125000);
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (2, 6, 950000);
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (4, 7, 300000);
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (4, 1, NULL);
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (4, 11, NULL);
INSERT INTO public.cataloguepresence(catalogueid, tapestryid, catalogprice) VALUES (4, 5, NULL);

COMMIT;
