CREATE TYPE "public"."absence_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."absence_type" AS ENUM('sick', 'vacation', 'personal', 'other', 'bvvd', 'persoonlijk');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('directeur', 'admin', 'manager', 'manager_az', 'employee', 'tijdelijk');--> statement-breakpoint
CREATE TABLE "absence_cancellations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"absence_id" varchar NOT NULL,
	"cancelled_date" date NOT NULL,
	"cancel_reason" text,
	"cancelled_by" varchar,
	"affects_balance" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "absence_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"bvvd_reason" text,
	"half_day" text,
	"status" "absence_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"deduct_vacation" boolean DEFAULT false,
	"cancel_reason" text,
	"persoonlijk_besluit" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"pdf_url" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_instructions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"procedure_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ao_procedures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "app_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"application_id" varchar NOT NULL,
	"access_level" text DEFAULT 'read' NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text,
	"path" text,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "beoordeling_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"medewerker" text NOT NULL,
	"functie" text,
	"afdeling" text,
	"beoordelaar" text,
	"datum" date NOT NULL,
	"periode" text,
	"total_score" text,
	"afspraken" text,
	"opmerking_medewerker" text,
	"opmerking_beoordelaar" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beoordeling_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar NOT NULL,
	"competency_id" varchar NOT NULL,
	"score" integer,
	"toelichting" text
);
--> statement-breakpoint
CREATE TABLE "cao_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_number" text NOT NULL,
	"title" text NOT NULL,
	"document_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"functie" text NOT NULL,
	"name" text NOT NULL,
	"norm_1" text DEFAULT '' NOT NULL,
	"norm_2" text DEFAULT '' NOT NULL,
	"norm_3" text DEFAULT '' NOT NULL,
	"norm_4" text DEFAULT '' NOT NULL,
	"norm_5" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "correctieverzoeken" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingediend_door" varchar NOT NULL,
	"kadaster_id" varchar(20) NOT NULL,
	"datum" date NOT NULL,
	"checktime" timestamp NOT NULL,
	"richting" text NOT NULL,
	"reden" text,
	"status" text DEFAULT 'aangevraagd' NOT NULL,
	"beoordeeld_door" varchar,
	"beoordeeld_at" timestamp,
	"beoordeling_notitie" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"manager_id" varchar,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"end_date" date,
	"time" text,
	"location" text,
	"category" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "functionering_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"medewerker" text NOT NULL,
	"functie" text,
	"afdeling" text,
	"leidinggevende" text,
	"datum" date NOT NULL,
	"periode" text,
	"terugblik_taken" text,
	"terugblik_resultaten" text,
	"terugblik_knelpunten" text,
	"werkinhoud" text,
	"samenwerking" text,
	"communicatie" text,
	"arbeidsomstandigheden" text,
	"persoonlijke_ontwikkeling" text,
	"scholingswensen" text,
	"doelstelling_1" text,
	"doelstelling_1_termijn" text,
	"doelstelling_2" text,
	"doelstelling_2_termijn" text,
	"doelstelling_3" text,
	"doelstelling_3_termijn" text,
	"afspraken" text,
	"opmerking_medewerker" text,
	"opmerking_leidinggevende" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_route" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "help_content_page_route_unique" UNIQUE("page_route")
);
--> statement-breakpoint
CREATE TABLE "import_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"imported_by" varchar,
	"bestandsnaam" text,
	"totaal_records" integer DEFAULT 0,
	"geldige_records" integer DEFAULT 0,
	"fout_records" integer DEFAULT 0,
	"waarschuwingen" integer DEFAULT 0,
	"status" text DEFAULT 'verwerkt' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jaarplan_acties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jaarplan_id" varchar NOT NULL,
	"onderdeel_id" varchar,
	"datum" date NOT NULL,
	"actie" text NOT NULL,
	"status" text DEFAULT 'niet gestart',
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jaarplan_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"afdeling" varchar NOT NULL,
	"year" integer NOT NULL,
	"afspraken" text NOT NULL,
	"start_datum" date,
	"eind_datum" date,
	"status" text DEFAULT 'niet gestart',
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jaarplan_onderdelen" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jaarplan_id" varchar NOT NULL,
	"naam" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_functions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department_id" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description_file_path" text,
	"begin_schaal" integer,
	"eind_schaal" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kartografie_productie" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" text NOT NULL,
	"binnengekomen" integer NOT NULL,
	"afgehandeld" integer NOT NULL,
	"gemiddeld" real NOT NULL,
	"kartografen" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legislation_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'algemeen' NOT NULL,
	"pdf_url" text
);
--> statement-breakpoint
CREATE TABLE "maand_prod_kartograaf" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"kartograaf" text NOT NULL,
	"mbr" integer DEFAULT 0 NOT NULL,
	"kad_spl" integer DEFAULT 0 NOT NULL,
	"gr_uitz" integer DEFAULT 0 NOT NULL,
	"ex_pl" integer DEFAULT 0 NOT NULL,
	"plot_coor" integer DEFAULT 0 NOT NULL,
	"losse_mbr" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_km_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"topo_kaarten" integer DEFAULT 0 NOT NULL,
	"plot_overzicht" integer DEFAULT 0 NOT NULL,
	"plot_grens_uitz" integer DEFAULT 0 NOT NULL,
	"afdrukken_kaarten" integer DEFAULT 0 NOT NULL,
	"sit_a4" integer DEFAULT 0 NOT NULL,
	"sit_a3" integer DEFAULT 0 NOT NULL,
	"reg_meetbrief" integer DEFAULT 0 NOT NULL,
	"reg_extractplan" integer DEFAULT 0 NOT NULL,
	"inzage_kad" integer DEFAULT 0 NOT NULL,
	"uur_tarieven" integer DEFAULT 0 NOT NULL,
	"digitale_bestanden" integer DEFAULT 0 NOT NULL,
	"blok_maten" integer DEFAULT 0 NOT NULL,
	"kopie_veldwerk" integer DEFAULT 0 NOT NULL,
	"coordinaten" integer DEFAULT 0 NOT NULL,
	"hulp_kaart" integer DEFAULT 0 NOT NULL,
	"terrein_onderzoek" integer DEFAULT 0 NOT NULL,
	"proces_verbaal" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_landmeter" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"landmeter" text NOT NULL,
	"ex_uitb" integer DEFAULT 0 NOT NULL,
	"meting" integer DEFAULT 0 NOT NULL,
	"gr_uitz" integer DEFAULT 0 NOT NULL,
	"l_meting" integer DEFAULT 0 NOT NULL,
	"plot_inzage_coord" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_or_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"inzage_or" integer DEFAULT 0 NOT NULL,
	"bulkdata" integer DEFAULT 0 NOT NULL,
	"verkorte_inzage" integer DEFAULT 0 NOT NULL,
	"schriftelijke_inzage" integer DEFAULT 0 NOT NULL,
	"kopie_akte" integer DEFAULT 0 NOT NULL,
	"her_inzage" integer DEFAULT 0 NOT NULL,
	"na_inzage" integer DEFAULT 0 NOT NULL,
	"kadastrale_legger" integer DEFAULT 0 NOT NULL,
	"verklaring_eensluidend" integer DEFAULT 0 NOT NULL,
	"verklaring_geen_or" integer DEFAULT 0 NOT NULL,
	"getuigschrift_volgende" integer DEFAULT 0 NOT NULL,
	"getuigschrift_or" integer DEFAULT 0 NOT NULL,
	"aktes" integer DEFAULT 0 NOT NULL,
	"inschrijvingen" integer DEFAULT 0 NOT NULL,
	"doorhalingen" integer DEFAULT 0 NOT NULL,
	"opheffingen" integer DEFAULT 0 NOT NULL,
	"beslagen" integer DEFAULT 0 NOT NULL,
	"cessies" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_or_notaris" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"notaris_key" text NOT NULL,
	"aktes" integer DEFAULT 0 NOT NULL,
	"inschrijvingen" integer DEFAULT 0 NOT NULL,
	"doorhalingen" integer DEFAULT 0 NOT NULL,
	"opheffingen" integer DEFAULT 0 NOT NULL,
	"beslagen" integer DEFAULT 0 NOT NULL,
	"cessies" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_samenvatting" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"binnengekomen" integer DEFAULT 0 NOT NULL,
	"aantal_kartografen" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maand_prod_samenvatting_lm" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"binnengekomen" integer DEFAULT 0 NOT NULL,
	"aantal_landmeters" integer DEFAULT 0 NOT NULL,
	"eilandgebied" integer DEFAULT 0 NOT NULL,
	"particulier" integer DEFAULT 0 NOT NULL,
	"grensuitzetting" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"reply" text,
	"replied_at" timestamp,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "official_holidays" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"year" integer NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "overuur_aanvragen" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userid" varchar(20) NOT NULL,
	"datum" date NOT NULL,
	"reden" text,
	"aangevraagd_door" varchar,
	"goedgekeurd_door" varchar,
	"status" text DEFAULT 'aangevraagd' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_development" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"training_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"function_title" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"salary" integer,
	"begin_schaal" integer,
	"eind_schaal" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "prikklok_event_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_at" timestamp DEFAULT now() NOT NULL,
	"import_id" varchar,
	"event_type" text DEFAULT 'info' NOT NULL,
	"userid" varchar(20),
	"checktime" timestamp,
	"bericht" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"reason" text NOT NULL,
	"awarded_by" varchar,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snipperdagen" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"year" integer NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_kartografen_hist" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"egaleano" integer DEFAULT 0 NOT NULL,
	"jpieters" integer DEFAULT 0 NOT NULL,
	"nsambo" integer DEFAULT 0 NOT NULL,
	"binnengekomen" integer DEFAULT 0 NOT NULL,
	"afgehandeld" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_km_buiten" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"binnengekomen" integer DEFAULT 0 NOT NULL,
	"afgehandeld" integer DEFAULT 0 NOT NULL,
	"uitbesteding" integer DEFAULT 0 NOT NULL,
	"gemiddeld" real DEFAULT 0 NOT NULL,
	"landmeters" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_km_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"kkp" integer DEFAULT 0 NOT NULL,
	"db" integer DEFAULT 0 NOT NULL,
	"sa" integer DEFAULT 0 NOT NULL,
	"rm" integer DEFAULT 0 NOT NULL,
	"re" integer DEFAULT 0 NOT NULL,
	"km" integer DEFAULT 0 NOT NULL,
	"ik" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_or_algemeen" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"aktes" integer DEFAULT 0 NOT NULL,
	"inschrijvingen" integer DEFAULT 0 NOT NULL,
	"doorhalingen" integer DEFAULT 0 NOT NULL,
	"opheffingen" integer DEFAULT 0 NOT NULL,
	"beslagen" integer DEFAULT 0 NOT NULL,
	"cessies" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_or_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"inzagen" integer DEFAULT 0 NOT NULL,
	"her_inzage" integer DEFAULT 0 NOT NULL,
	"na_inzage" integer DEFAULT 0 NOT NULL,
	"kadastaal_legger" integer DEFAULT 0 NOT NULL,
	"verklaring" integer DEFAULT 0 NOT NULL,
	"getuigschrift" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_or_notaris" (
	"id" serial PRIMARY KEY NOT NULL,
	"jaar" integer NOT NULL,
	"maand" integer NOT NULL,
	"notaris_key" text NOT NULL,
	"waarde" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"department" text,
	"avatar" text,
	"active" boolean DEFAULT true NOT NULL,
	"permissions" text[],
	"start_date" date,
	"end_date" date,
	"birth_date" date,
	"vacation_days_total" integer DEFAULT 25,
	"vacation_days_saldo_oud" integer DEFAULT 0,
	"phone_extension" text,
	"functie" text,
	"kadaster_id" text,
	"cedula_nr" text,
	"telefoonnr" text,
	"mobielnr" text,
	"adres" text,
	"voornamen" text,
	"voorvoegsel" text,
	"achternaam" text,
	"vacation_days_cancel" real DEFAULT 0,
	"titels_voor" text[],
	"titels_achter" text[],
	"must_change_password" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "werktijden" (
	"logid" serial PRIMARY KEY NOT NULL,
	"userid" varchar(20) NOT NULL,
	"checktime" timestamp NOT NULL,
	"checktype" text DEFAULT 'in' NOT NULL,
	"import_id" varchar
);
--> statement-breakpoint
CREATE TABLE "yearly_awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"photo" text,
	"awarded_by" varchar,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absence_cancellations" ADD CONSTRAINT "absence_cancellations_absence_id_absences_id_fk" FOREIGN KEY ("absence_id") REFERENCES "public"."absences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_cancellations" ADD CONSTRAINT "absence_cancellations_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_instructions" ADD CONSTRAINT "ao_instructions_procedure_id_ao_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."ao_procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ao_procedures" ADD CONSTRAINT "ao_procedures_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_access" ADD CONSTRAINT "app_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_access" ADD CONSTRAINT "app_access_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beoordeling_reviews" ADD CONSTRAINT "beoordeling_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beoordeling_reviews" ADD CONSTRAINT "beoordeling_reviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beoordeling_scores" ADD CONSTRAINT "beoordeling_scores_review_id_beoordeling_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."beoordeling_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beoordeling_scores" ADD CONSTRAINT "beoordeling_scores_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correctieverzoeken" ADD CONSTRAINT "correctieverzoeken_ingediend_door_users_id_fk" FOREIGN KEY ("ingediend_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correctieverzoeken" ADD CONSTRAINT "correctieverzoeken_beoordeeld_door_users_id_fk" FOREIGN KEY ("beoordeeld_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "functionering_reviews" ADD CONSTRAINT "functionering_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "functionering_reviews" ADD CONSTRAINT "functionering_reviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_log" ADD CONSTRAINT "import_log_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jaarplan_acties" ADD CONSTRAINT "jaarplan_acties_jaarplan_id_jaarplan_items_id_fk" FOREIGN KEY ("jaarplan_id") REFERENCES "public"."jaarplan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jaarplan_acties" ADD CONSTRAINT "jaarplan_acties_onderdeel_id_jaarplan_onderdelen_id_fk" FOREIGN KEY ("onderdeel_id") REFERENCES "public"."jaarplan_onderdelen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jaarplan_acties" ADD CONSTRAINT "jaarplan_acties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jaarplan_items" ADD CONSTRAINT "jaarplan_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jaarplan_onderdelen" ADD CONSTRAINT "jaarplan_onderdelen_jaarplan_id_jaarplan_items_id_fk" FOREIGN KEY ("jaarplan_id") REFERENCES "public"."jaarplan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_functions" ADD CONSTRAINT "job_functions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "official_holidays" ADD CONSTRAINT "official_holidays_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overuur_aanvragen" ADD CONSTRAINT "overuur_aanvragen_aangevraagd_door_users_id_fk" FOREIGN KEY ("aangevraagd_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overuur_aanvragen" ADD CONSTRAINT "overuur_aanvragen_goedgekeurd_door_users_id_fk" FOREIGN KEY ("goedgekeurd_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_development" ADD CONSTRAINT "personal_development_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prikklok_event_log" ADD CONSTRAINT "prikklok_event_log_import_id_import_log_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snipperdagen" ADD CONSTRAINT "snipperdagen_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "werktijden" ADD CONSTRAINT "werktijden_import_id_import_log_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."import_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_awards" ADD CONSTRAINT "yearly_awards_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;