CREATE TABLE IF NOT EXISTS "countries" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "countries" ("code", "name") VALUES
	('AF','Afghanistan'),
	('AL','Albania'),
	('DZ','Algeria'),
	('AD','Andorra'),
	('AO','Angola'),
	('AG','Antigua and Barbuda'),
	('AR','Argentina'),
	('AM','Armenia'),
	('AU','Australia'),
	('AT','Austria'),
	('AZ','Azerbaijan'),
	('BS','Bahamas'),
	('BH','Bahrain'),
	('BD','Bangladesh'),
	('BB','Barbados'),
	('BY','Belarus'),
	('BE','Belgium'),
	('BZ','Belize'),
	('BJ','Benin'),
	('BT','Bhutan'),
	('BO','Bolivia'),
	('BA','Bosnia and Herzegovina'),
	('BW','Botswana'),
	('BR','Brazil'),
	('BN','Brunei'),
	('BG','Bulgaria'),
	('BF','Burkina Faso'),
	('BI','Burundi'),
	('CV','Cabo Verde'),
	('KH','Cambodia'),
	('CM','Cameroon'),
	('CA','Canada'),
	('CF','Central African Republic'),
	('TD','Chad'),
	('CL','Chile'),
	('CN','China'),
	('CO','Colombia'),
	('KM','Comoros'),
	('CG','Congo'),
	('CD','Congo (DRC)'),
	('CR','Costa Rica'),
	('HR','Croatia'),
	('CU','Cuba'),
	('CY','Cyprus'),
	('CZ','Czech Republic'),
	('DK','Denmark'),
	('DJ','Djibouti'),
	('DM','Dominica'),
	('DO','Dominican Republic'),
	('EC','Ecuador'),
	('EG','Egypt'),
	('SV','El Salvador'),
	('GQ','Equatorial Guinea'),
	('ER','Eritrea'),
	('EE','Estonia'),
	('SZ','Eswatini'),
	('ET','Ethiopia'),
	('FJ','Fiji'),
	('FI','Finland'),
	('FR','France'),
	('GA','Gabon'),
	('GM','Gambia'),
	('GE','Georgia'),
	('DE','Germany'),
	('GH','Ghana'),
	('GR','Greece'),
	('GD','Grenada'),
	('GT','Guatemala'),
	('GN','Guinea'),
	('GW','Guinea-Bissau'),
	('GY','Guyana'),
	('HT','Haiti'),
	('HN','Honduras'),
	('HU','Hungary'),
	('IS','Iceland'),
	('IN','India'),
	('ID','Indonesia'),
	('IR','Iran'),
	('IQ','Iraq'),
	('IE','Ireland'),
	('IL','Israel'),
	('IT','Italy'),
	('JM','Jamaica'),
	('JP','Japan'),
	('JO','Jordan'),
	('KZ','Kazakhstan'),
	('KE','Kenya'),
	('KI','Kiribati'),
	('KP','Korea (North)'),
	('KR','Korea (South)'),
	('KW','Kuwait'),
	('KG','Kyrgyzstan'),
	('LA','Laos'),
	('LV','Latvia'),
	('LB','Lebanon'),
	('LS','Lesotho'),
	('LR','Liberia'),
	('LY','Libya'),
	('LI','Liechtenstein'),
	('LT','Lithuania'),
	('LU','Luxembourg'),
	('MG','Madagascar'),
	('MW','Malawi'),
	('MY','Malaysia'),
	('MV','Maldives'),
	('ML','Mali'),
	('MT','Malta'),
	('MH','Marshall Islands'),
	('MR','Mauritania'),
	('MU','Mauritius'),
	('MX','Mexico'),
	('FM','Micronesia'),
	('MD','Moldova'),
	('MC','Monaco'),
	('MN','Mongolia'),
	('ME','Montenegro'),
	('MA','Morocco'),
	('MZ','Mozambique'),
	('MM','Myanmar'),
	('NA','Namibia'),
	('NR','Nauru'),
	('NP','Nepal'),
	('NL','Netherlands'),
	('NZ','New Zealand'),
	('NI','Nicaragua'),
	('NE','Niger'),
	('NG','Nigeria'),
	('MK','North Macedonia'),
	('NO','Norway'),
	('OM','Oman'),
	('PK','Pakistan'),
	('PW','Palau'),
	('PA','Panama'),
	('PG','Papua New Guinea'),
	('PY','Paraguay'),
	('PE','Peru'),
	('PH','Philippines'),
	('PL','Poland'),
	('PT','Portugal'),
	('QA','Qatar'),
	('RO','Romania'),
	('RU','Russia'),
	('RW','Rwanda'),
	('KN','Saint Kitts and Nevis'),
	('LC','Saint Lucia'),
	('VC','Saint Vincent and the Grenadines'),
	('WS','Samoa'),
	('SM','San Marino'),
	('ST','São Tomé and Príncipe'),
	('SA','Saudi Arabia'),
	('SN','Senegal'),
	('RS','Serbia'),
	('SC','Seychelles'),
	('SL','Sierra Leone'),
	('SG','Singapore'),
	('SK','Slovakia'),
	('SI','Slovenia'),
	('SB','Solomon Islands'),
	('SO','Somalia'),
	('ZA','South Africa'),
	('SS','South Sudan'),
	('ES','Spain'),
	('LK','Sri Lanka'),
	('SD','Sudan'),
	('SR','Suriname'),
	('SE','Sweden'),
	('CH','Switzerland'),
	('SY','Syria'),
	('TW','Taiwan'),
	('TJ','Tajikistan'),
	('TZ','Tanzania'),
	('TH','Thailand'),
	('TL','Timor-Leste'),
	('TG','Togo'),
	('TO','Tonga'),
	('TT','Trinidad and Tobago'),
	('TN','Tunisia'),
	('TR','Turkey'),
	('TM','Turkmenistan'),
	('TV','Tuvalu'),
	('UG','Uganda'),
	('UA','Ukraine'),
	('AE','United Arab Emirates'),
	('GB','United Kingdom'),
	('US','United States'),
	('UY','Uruguay'),
	('UZ','Uzbekistan'),
	('VU','Vanuatu'),
	('VE','Venezuela'),
	('VN','Vietnam'),
	('YE','Yemen'),
	('ZM','Zambia'),
	('ZW','Zimbabwe')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";
--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "name" TYPE varchar(160);
ALTER TABLE "trips" ALTER COLUMN "country_code" TYPE varchar(2);
ALTER TABLE "trips" ALTER COLUMN "visited_cities" TYPE varchar(500);
ALTER TABLE "trips" ALTER COLUMN "reason_for_visit" TYPE varchar(255);
ALTER TABLE "trips" ALTER COLUMN "travel_companions" TYPE varchar(255);
ALTER TABLE "trips" ALTER COLUMN "friends_family_met" TYPE varchar(255);
ALTER TABLE "trips" ALTER COLUMN "visited_at" TYPE date USING "visited_at"::date;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "trips" ADD CONSTRAINT "trips_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE NO ACTION ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "title" TYPE varchar(200);
ALTER TABLE "posts" ALTER COLUMN "slug" TYPE varchar(200);
ALTER TABLE "posts" ALTER COLUMN "cover_image_url" TYPE varchar(2048);
ALTER TABLE "posts" ALTER COLUMN "location" TYPE varchar(255);
ALTER TABLE "posts" ALTER COLUMN "published_at" TYPE date USING NULLIF("published_at", '')::date;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "country_code" varchar(2);
UPDATE "posts"
SET "country_code" = "trips"."country_code"
FROM "trips"
WHERE "posts"."trip_id" = "trips"."id"
  AND "posts"."country_code" IS NULL;
ALTER TABLE "posts" DROP COLUMN IF EXISTS "country_id";
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "posts" ADD CONSTRAINT "posts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "posts" ADD CONSTRAINT "posts_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "url" TYPE varchar(2048);
ALTER TABLE "photos" ALTER COLUMN "link" TYPE varchar(2048);
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "trip_id" integer;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "country_code" varchar(2);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "photos" ADD CONSTRAINT "photos_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "photos" ADD CONSTRAINT "photos_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
