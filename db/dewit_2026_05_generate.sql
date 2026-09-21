/*==============================================================*/
/* DBMS name:      PostgreSQL 8                                 */
/* Created on:     17-09-26 20:25:34                            */
/*==============================================================*/


drop index ARTIST_PK;

drop table ARTIST;

drop index RELATIONPARTNER_FK;

drop index RELATIONTYPE_FK;

drop index BPRELATIONSHIP_PK;

drop table BPRELATIONSHIP;

drop index BUSINESSPARTNER_PK;

drop table BUSINESSPARTNER;

drop index CATALOGUE_PK;

drop table CATALOGUE;

drop index HOSTINGCATALOG_FK;

drop index LISTEDTAPESTRY_FK;

drop index CATALOGUEPRESENCE_PK;

drop table CATALOGUEPRESENCE;

drop index TAPESTRYCLEANING_FK;

drop index CLEANING_PK;

drop table CLEANING;

drop index BPID_LOCATION_FK;

drop index LOCATION_PK;

drop table LOCATION;

drop index ORIENTATION_PK;

drop table ORIENTATION;

drop index BPOWNERSHIP_FK;

drop index TAPESTRYOWNERSHIP_FK;

drop index OWNERSHIP_PK;

drop table OWNERSHIP;

drop index PICTURE_PK;

drop table PICTURE;

drop index RELATIONTYPE_PK;

drop table RELATIONTYPE;

drop index SALE_FK;

drop index BUYER_FK;

drop index SELLER_FK;

drop index SALESINFORMATION_PK;

drop table SALESINFORMATION;

drop index SUBLOCATION_FK;

drop index SUBLOCATION_PK;

drop table SUBLOCATION;

drop index TAPESTRYORIENTATION_FK;

drop index ARTIST_FK;

drop index TAPESTRY_PK;

drop table TAPESTRY;

drop index TAPESTRYSUBLOCATION_FK;

drop index AREALOCATION_FK;

drop index BUSINESSPARTNERLOCATION_FK;

drop index TAPESTRYLOCATION_FK;

drop index TAPESTRYLOCATION_PK;

drop table TAPESTRYLOCATION;

drop index TAPESTRYTOPICTURES_FK;

drop index PICTURETOTAPESTRY_FK;

drop index TAPESTRYPICTURE_PK;

drop table TAPESTRYPICTURE;

/*==============================================================*/
/* Table: ARTIST                                                */
/*==============================================================*/
create table ARTIST (
   ID                   SERIAL               not null,
   NAME                 TEXT                 not null,
   PERIOD               TEXT                 null,
   constraint PK_ARTIST primary key (ID)
);

comment on table ARTIST is
'Tapestry'' artists list';

/*==============================================================*/
/* Index: ARTIST_PK                                             */
/*==============================================================*/
create unique index ARTIST_PK on ARTIST (
ID
);

/*==============================================================*/
/* Table: BPRELATIONSHIP                                        */
/*==============================================================*/
create table BPRELATIONSHIP (
   ID                   SERIAL               not null,
   RELATIONTYPEID       INT4                 not null,
   BUSINESSPARTNERID    INT4                 not null,
   constraint PK_BPRELATIONSHIP primary key (ID)
);

/*==============================================================*/
/* Index: BPRELATIONSHIP_PK                                     */
/*==============================================================*/
create unique index BPRELATIONSHIP_PK on BPRELATIONSHIP (
ID
);

/*==============================================================*/
/* Index: RELATIONTYPE_FK                                       */
/*==============================================================*/
create  index RELATIONTYPE_FK on BPRELATIONSHIP (
RELATIONTYPEID
);

/*==============================================================*/
/* Index: RELATIONPARTNER_FK                                    */
/*==============================================================*/
create  index RELATIONPARTNER_FK on BPRELATIONSHIP (
BUSINESSPARTNERID
);

/*==============================================================*/
/* Table: BUSINESSPARTNER                                       */
/*==============================================================*/
create table BUSINESSPARTNER (
   ID                   SERIAL               not null,
   NAME                 TEXT                 not null,
   ADDRESSSTREET        TEXT                 null,
   ADDRESSNR            TEXT                 null,
   ADDRESSCOUNTRY       TEXT                 null,
   ADDRESSTOWN          TEXT                 null,
   ACTIVE               BOOL                 not null,
   constraint PK_BUSINESSPARTNER primary key (ID)
);

comment on table BUSINESSPARTNER is
'Business partners : Customers, Suppliers, Self, ...';

/*==============================================================*/
/* Index: BUSINESSPARTNER_PK                                    */
/*==============================================================*/
create unique index BUSINESSPARTNER_PK on BUSINESSPARTNER (
ID
);

/*==============================================================*/
/* Table: CATALOGUE                                             */
/*==============================================================*/
create table CATALOGUE (
   ID                   SERIAL               not null,
   NAME                 TEXT                 not null,
   DATESTART            DATE                 not null,
   DATEEND              DATE                 not null,
   constraint PK_CATALOGUE primary key (ID)
);

/*==============================================================*/
/* Index: CATALOGUE_PK                                          */
/*==============================================================*/
create unique index CATALOGUE_PK on CATALOGUE (
ID
);

/*==============================================================*/
/* Table: CATALOGUEPRESENCE                                     */
/*==============================================================*/
create table CATALOGUEPRESENCE (
   ID                   SERIAL               not null,
   CATALOGUEID          INT4                 not null,
   TAPESTRYID           INT4                 not null,
   CATALOGPRICE         INT4                 null,
   constraint PK_CATALOGUEPRESENCE primary key (ID)
);

comment on table CATALOGUEPRESENCE is
'Presence of tapestry on one or many Catalogs';

/*==============================================================*/
/* Index: CATALOGUEPRESENCE_PK                                  */
/*==============================================================*/
create unique index CATALOGUEPRESENCE_PK on CATALOGUEPRESENCE (
ID
);

/*==============================================================*/
/* Index: LISTEDTAPESTRY_FK                                     */
/*==============================================================*/
create  index LISTEDTAPESTRY_FK on CATALOGUEPRESENCE (
TAPESTRYID
);

/*==============================================================*/
/* Index: HOSTINGCATALOG_FK                                     */
/*==============================================================*/
create  index HOSTINGCATALOG_FK on CATALOGUEPRESENCE (
CATALOGUEID
);

/*==============================================================*/
/* Table: CLEANING                                              */
/*==============================================================*/
create table CLEANING (
   ID                   SERIAL               not null,
   TAPESTRYID           INT4                 not null,
   DATECLEANING         DATE                 null,
   COMMENTS             TEXT                 null,
   constraint PK_CLEANING primary key (ID)
);

/*==============================================================*/
/* Index: CLEANING_PK                                           */
/*==============================================================*/
create unique index CLEANING_PK on CLEANING (
ID
);

/*==============================================================*/
/* Index: TAPESTRYCLEANING_FK                                   */
/*==============================================================*/
create  index TAPESTRYCLEANING_FK on CLEANING (
TAPESTRYID
);

/*==============================================================*/
/* Table: LOCATION                                              */
/*==============================================================*/
create table LOCATION (
   ID                   SERIAL               not null,
   BPID                 INT4                 not null,
   NAME                 TEXT                 not null,
   COUNTRYINFORMATION   TEXT                 null,
   constraint PK_LOCATION primary key (ID)
);

comment on table LOCATION is
'Place where Tapestry is placed, specific by business partner.';

/*==============================================================*/
/* Index: LOCATION_PK                                           */
/*==============================================================*/
create unique index LOCATION_PK on LOCATION (
ID
);

/*==============================================================*/
/* Index: BPID_LOCATION_FK                                      */
/*==============================================================*/
create  index BPID_LOCATION_FK on LOCATION (
BPID
);

/*==============================================================*/
/* Table: ORIENTATION                                           */
/*==============================================================*/
create table ORIENTATION (
   ID                   SERIAL               not null,
   NAME                 TEXT                 null,
   constraint PK_ORIENTATION primary key (ID)
);

comment on table ORIENTATION is
'Tapestry Orientation';

/*==============================================================*/
/* Index: ORIENTATION_PK                                        */
/*==============================================================*/
create unique index ORIENTATION_PK on ORIENTATION (
ID
);

/*==============================================================*/
/* Table: OWNERSHIP                                             */
/*==============================================================*/
create table OWNERSHIP (
   ID                   SERIAL               not null,
   OWNERID              INT4                 not null,
   TAPESTRYID           INT4                 not null,
   DATESTART            DATE                 null,
   DATEEND              DATE                 null,
   ACTIVE               BOOL                 not null,
   constraint PK_OWNERSHIP primary key (ID)
);

/*==============================================================*/
/* Index: OWNERSHIP_PK                                          */
/*==============================================================*/
create unique index OWNERSHIP_PK on OWNERSHIP (
ID
);

/*==============================================================*/
/* Index: TAPESTRYOWNERSHIP_FK                                  */
/*==============================================================*/
create  index TAPESTRYOWNERSHIP_FK on OWNERSHIP (
TAPESTRYID
);

/*==============================================================*/
/* Index: BPOWNERSHIP_FK                                        */
/*==============================================================*/
create  index BPOWNERSHIP_FK on OWNERSHIP (
OWNERID
);

/*==============================================================*/
/* Table: PICTURE                                               */
/*==============================================================*/
create table PICTURE (
   ID                   SERIAL               not null,
   PATH                 TEXT                 not null,
   MIMETYPE             TEXT                 not null,
   NAME                 TEXT                 not null,
   DESCRIPTION          TEXT                 null,
   DESCRIPTIONAUTHOR    TEXT                 null,
   constraint PK_PICTURE primary key (ID)
);

/*==============================================================*/
/* Index: PICTURE_PK                                            */
/*==============================================================*/
create unique index PICTURE_PK on PICTURE (
ID
);

/*==============================================================*/
/* Table: RELATIONTYPE                                          */
/*==============================================================*/
create table RELATIONTYPE (
   ID                   SERIAL               not null,
   NAME                 TEXT                 not null,
   constraint PK_RELATIONTYPE primary key (ID)
);

comment on table RELATIONTYPE is
'Types of relation with business partners : Customer, Tentative Customer, Supplier, Self (1)';

/*==============================================================*/
/* Index: RELATIONTYPE_PK                                       */
/*==============================================================*/
create unique index RELATIONTYPE_PK on RELATIONTYPE (
ID
);

/*==============================================================*/
/* Table: SALESINFORMATION                                      */
/*==============================================================*/
create table SALESINFORMATION (
   ID                   SERIAL               not null,
   SELLER               INT4                 not null,
   BUYER                INT4                 null,
   TAPESTRYID           INT4                 not null,
   MINPRICE             FLOAT8               null,
   TRANSACTIONDATE      DATE                 null,
   SALEDATESTART        DATE                 null,
   ACTIVE               BOOL                 not null,
   TRANSACTIONPRICE     FLOAT8               null,
   constraint PK_SALESINFORMATION primary key (ID)
);

comment on table SALESINFORMATION is
'Information on tapestries that are for sale';

/*==============================================================*/
/* Index: SALESINFORMATION_PK                                   */
/*==============================================================*/
create unique index SALESINFORMATION_PK on SALESINFORMATION (
ID
);

/*==============================================================*/
/* Index: SELLER_FK                                             */
/*==============================================================*/
create  index SELLER_FK on SALESINFORMATION (
SELLER
);

/*==============================================================*/
/* Index: BUYER_FK                                              */
/*==============================================================*/
create  index BUYER_FK on SALESINFORMATION (
BUYER
);

/*==============================================================*/
/* Index: SALE_FK                                               */
/*==============================================================*/
create  index SALE_FK on SALESINFORMATION (
TAPESTRYID
);

/*==============================================================*/
/* Table: SUBLOCATION                                           */
/*==============================================================*/
create table SUBLOCATION (
   ID                   SERIAL               not null,
   LOCATIONID           INT4                 not null,
   DESCRIPTION          TEXT                 not null,
   constraint PK_SUBLOCATION primary key (ID)
);

/*==============================================================*/
/* Index: SUBLOCATION_PK                                        */
/*==============================================================*/
create unique index SUBLOCATION_PK on SUBLOCATION (
ID
);

/*==============================================================*/
/* Index: SUBLOCATION_FK                                        */
/*==============================================================*/
create  index SUBLOCATION_FK on SUBLOCATION (
LOCATIONID
);

/*==============================================================*/
/* Table: TAPESTRY                                              */
/*==============================================================*/
create table TAPESTRY (
   ID                   SERIAL               not null,
   ARTIST               INT4                 not null,
   ORIENTATION          INT4                 not null,
   INVENTORYNUMBER      TEXT                 not null,
   TYPE                 TEXT                 null,
   CENTURY              INT4                 null,
   DATE                 DATE                 null,
   CONSERVATION         INT4                 null,
   ORIGIN               TEXT                 null,
   HEIGHT               FLOAT8               null,
   WIDTH                FLOAT8               null,
   SURFACE              FLOAT8               null,
   FRAGMENT             BOOL                 not null,
   FORSALE              BOOL                 not null,
   VELCRO               BOOL                 not null,
   LINING               BOOL                 not null,
   PRIVATECOLLECTION    BOOL                 not null,
   DEFINITIVESIZE       BOOL                 not null,
   LABEL                BOOL                 not null,
   EDITION              TEXT                 null,
   DESCRIPTIONEN        TEXT                 null,
   DESCRIPTIONNL        TEXT                 null,
   DESCRIPTIONFR        TEXT                 null,
   DESCRIPTIONAUTHOR    TEXT                 null,
   TITLEEN              TEXT                 null,
   TITLENL              TEXT                 null,
   TITLEFR              TEXT                 null,
   constraint PK_TAPESTRY primary key (ID)
);

comment on table TAPESTRY is
'Tapestry entity';

comment on column TAPESTRY.CONSERVATION is
'~Date when tapestry was stored at manufactury';

/*==============================================================*/
/* Index: TAPESTRY_PK                                           */
/*==============================================================*/
create unique index TAPESTRY_PK on TAPESTRY (
ID
);

/*==============================================================*/
/* Index: ARTIST_FK                                             */
/*==============================================================*/
create  index ARTIST_FK on TAPESTRY (
ARTIST
);

/*==============================================================*/
/* Index: TAPESTRYORIENTATION_FK                                */
/*==============================================================*/
create  index TAPESTRYORIENTATION_FK on TAPESTRY (
ORIENTATION
);

/*==============================================================*/
/* Table: TAPESTRYLOCATION                                      */
/*==============================================================*/
create table TAPESTRYLOCATION (
   ID                   SERIAL               not null,
   TAPESTRYID           INT4                 not null,
   BUSINESSPARTNERID    INT4                 not null,
   LOCATIONID           INT4                 not null,
   SUBLOCATIONID        INT4                 null,
   ACTIVE               BOOL                 not null,
   "IN"                 DATE                 null,
   OUT                  DATE                 null,
   COMMENTS             TEXT                 null,
   constraint PK_TAPESTRYLOCATION primary key (ID)
);

/*==============================================================*/
/* Index: TAPESTRYLOCATION_PK                                   */
/*==============================================================*/
create unique index TAPESTRYLOCATION_PK on TAPESTRYLOCATION (
ID
);

/*==============================================================*/
/* Index: TAPESTRYLOCATION_FK                                   */
/*==============================================================*/
create  index TAPESTRYLOCATION_FK on TAPESTRYLOCATION (
TAPESTRYID
);

/*==============================================================*/
/* Index: BUSINESSPARTNERLOCATION_FK                            */
/*==============================================================*/
create  index BUSINESSPARTNERLOCATION_FK on TAPESTRYLOCATION (
BUSINESSPARTNERID
);

/*==============================================================*/
/* Index: AREALOCATION_FK                                       */
/*==============================================================*/
create  index AREALOCATION_FK on TAPESTRYLOCATION (
LOCATIONID
);

/*==============================================================*/
/* Index: TAPESTRYSUBLOCATION_FK                                */
/*==============================================================*/
create  index TAPESTRYSUBLOCATION_FK on TAPESTRYLOCATION (
SUBLOCATIONID
);

/*==============================================================*/
/* Table: TAPESTRYPICTURE                                       */
/*==============================================================*/
create table TAPESTRYPICTURE (
   ID                   SERIAL               not null,
   TAPESTRYID           INT4                 not null,
   PICTUREID            INT4                 not null,
   ACTIVE               BOOL                 not null,
   DATEINFORMATION      TEXT                 null,
   UV                   BOOL                 null,
   constraint PK_TAPESTRYPICTURE primary key (ID)
);

/*==============================================================*/
/* Index: TAPESTRYPICTURE_PK                                    */
/*==============================================================*/
create unique index TAPESTRYPICTURE_PK on TAPESTRYPICTURE (
ID
);

/*==============================================================*/
/* Index: PICTURETOTAPESTRY_FK                                  */
/*==============================================================*/
create  index PICTURETOTAPESTRY_FK on TAPESTRYPICTURE (
PICTUREID
);

/*==============================================================*/
/* Index: TAPESTRYTOPICTURES_FK                                 */
/*==============================================================*/
create  index TAPESTRYTOPICTURES_FK on TAPESTRYPICTURE (
TAPESTRYID
);

alter table BPRELATIONSHIP
   add constraint FK_BPRELATI_RELATIONP_BUSINESS foreign key (BUSINESSPARTNERID)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table BPRELATIONSHIP
   add constraint FK_BPRELATI_RELATIONT_RELATION foreign key (RELATIONTYPEID)
      references RELATIONTYPE (ID)
      on delete restrict on update restrict;

alter table CATALOGUEPRESENCE
   add constraint FK_CATALOGU_HOSTINGCA_CATALOGU foreign key (CATALOGUEID)
      references CATALOGUE (ID)
      on delete restrict on update restrict;

alter table CATALOGUEPRESENCE
   add constraint FK_CATALOGU_LISTEDTAP_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

alter table CLEANING
   add constraint FK_CLEANING_TAPESTRYC_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

alter table LOCATION
   add constraint FK_LOCATION_BPID_LOCA_BUSINESS foreign key (BPID)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table OWNERSHIP
   add constraint FK_OWNERSHI_BPOWNERSH_BUSINESS foreign key (OWNERID)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table OWNERSHIP
   add constraint FK_OWNERSHI_TAPESTRYO_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

alter table SALESINFORMATION
   add constraint FK_SALESINF_BUYER_BUSINESS foreign key (BUYER)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table SALESINFORMATION
   add constraint FK_SALESINF_SALE_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

alter table SALESINFORMATION
   add constraint FK_SALESINF_SELLER_BUSINESS foreign key (SELLER)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table SUBLOCATION
   add constraint FK_SUBLOCAT_SUBLOCATI_LOCATION foreign key (LOCATIONID)
      references LOCATION (ID)
      on delete restrict on update restrict;

alter table TAPESTRY
   add constraint FK_TAPESTRY_ARTIST_ARTIST foreign key (ARTIST)
      references ARTIST (ID)
      on delete restrict on update restrict;

alter table TAPESTRY
   add constraint FK_TAPESTRY_TAPESTRYO_ORIENTAT foreign key (ORIENTATION)
      references ORIENTATION (ID)
      on delete restrict on update restrict;

alter table TAPESTRYLOCATION
   add constraint FK_TAPESTRY_AREALOCAT_LOCATION foreign key (LOCATIONID)
      references LOCATION (ID)
      on delete restrict on update restrict;

alter table TAPESTRYLOCATION
   add constraint FK_TAPESTRY_BUSINESSP_BUSINESS foreign key (BUSINESSPARTNERID)
      references BUSINESSPARTNER (ID)
      on delete restrict on update restrict;

alter table TAPESTRYLOCATION
   add constraint FK_TAPESTRY_TAPESTRYL_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

alter table TAPESTRYLOCATION
   add constraint FK_TAPESTRY_TAPESTRYS_SUBLOCAT foreign key (SUBLOCATIONID)
      references SUBLOCATION (ID)
      on delete restrict on update restrict;

alter table TAPESTRYPICTURE
   add constraint FK_TAPESTRY_PICTURETO_PICTURE foreign key (PICTUREID)
      references PICTURE (ID)
      on delete restrict on update restrict;

alter table TAPESTRYPICTURE
   add constraint FK_TAPESTRY_TAPESTRYT_TAPESTRY foreign key (TAPESTRYID)
      references TAPESTRY (ID)
      on delete restrict on update restrict;

