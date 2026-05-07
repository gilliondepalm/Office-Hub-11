import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, Pencil, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdminRole } from "@shared/schema";
import type { HelpContent } from "@shared/schema";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import KalenderPage from "@/pages/kalender";
import AankondigingenPage from "@/pages/aankondigingen";
import OrganisatiePage from "@/pages/organisatie";
import PersonaliaPage from "@/pages/personalia";
import VerzuimPage from "@/pages/verzuim";
import ApplicatiesPage from "@/pages/applicaties";
import RapportenPage from "@/pages/rapporten";
import ProductiePage from "@/pages/productie";
import WerktijdenPage from "@/pages/werktijden";
import BeheerPage from "@/pages/beheer";
import BeloningenPage from "@/pages/beloningen";
import ProfielPage from "@/pages/profiel";

function OrganisatieZichtbaarheidTabel() {
  const IEDEREEN = <span className="text-green-600 dark:text-green-400 font-bold">✓</span>;
  const AFDELING = <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">✓ afd.</span>;
  const EIGEN = <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">✓ eigen</span>;
  const NEE = <span className="text-muted-foreground/40">—</span>;

  const rows: { label: string; iedereen: React.ReactNode; afdeling: React.ReactNode; eigen: React.ReactNode }[] = [
    { label: "Organogram",               iedereen: IEDEREEN, afdeling: NEE,      eigen: NEE },
    { label: "CAO Info",                 iedereen: IEDEREEN, afdeling: NEE,      eigen: NEE },
    { label: "Wetgeving",                iedereen: IEDEREEN, afdeling: NEE,      eigen: NEE },
    { label: "Huishoudelijk Reglement",  iedereen: IEDEREEN, afdeling: NEE,      eigen: NEE },
    { label: "AO-Procedures",            iedereen: NEE,      afdeling: AFDELING, eigen: NEE },
    { label: "Instructies",              iedereen: NEE,      afdeling: AFDELING, eigen: NEE },
    { label: "Functiebeschrijving",      iedereen: NEE,      afdeling: NEE,      eigen: EIGEN },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Overzicht van de zichtbaarheid van documenten in de <strong>Organisatie</strong> module.{" "}
        <span className="text-amber-600 dark:text-amber-400 font-semibold">✓ afd.</span> = alleen medewerkers van de eigen afdeling.{" "}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">✓ eigen</span> = alleen de ingelogde medewerker zelf.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Document / Sectie</th>
              <th className="text-center py-2 px-3 font-semibold text-muted-foreground whitespace-nowrap">Iedereen</th>
              <th className="text-center py-2 px-3 font-semibold text-muted-foreground whitespace-nowrap">Eigen afdeling</th>
              <th className="text-center py-2 px-3 font-semibold text-muted-foreground whitespace-nowrap">Eigen medewerker</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                <td className="py-2 px-3 font-medium text-foreground">{row.label}</td>
                <td className="py-2 px-3 text-center">{row.iedereen}</td>
                <td className="py-2 px-3 text-center">{row.afdeling}</td>
                <td className="py-2 px-3 text-center">{row.eigen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RollenRechtentabel() {
  const rollen = ["Directeur", "Beheerder", "Beheerder AZ", "Manager", "Medewerker"];
  const JA = <span className="text-green-600 dark:text-green-400 font-bold">✓</span>;
  const JA_AFDELING = <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">✓ afd.</span>;
  const NEE = <span className="text-muted-foreground/40">—</span>;

  const rows: { label: string; cells: React.ReactNode[] }[] = [
    { label: "Dashboard", cells: [JA, JA, JA, JA, JA] },
    { label: "Kalender bekijken", cells: [JA, JA, JA, JA, JA] },
    { label: "Kalender beheren", cells: [JA, JA, JA, JA, NEE] },
    { label: "Aankondigingen bekijken", cells: [JA, JA, JA, JA, JA] },
    { label: "Aankondigingen aanmaken", cells: [JA, JA, JA, NEE, NEE] },
    { label: "Berichten sturen", cells: [JA, JA, JA, JA, NEE] },
    { label: "Organisatie", cells: [JA, JA, JA, JA, NEE] },
    { label: "Personalia bekijken", cells: [JA, JA, JA, JA, NEE] },
    { label: "Personalia bewerken", cells: [JA, JA, JA, NEE, NEE] },
    { label: "Verzuim (eigen aanvragen)", cells: [JA, JA, JA, JA, JA] },
    { label: "Verzuim goedkeuren", cells: [JA, JA, JA, JA_AFDELING, NEE] },
    { label: "Vakantiesaldo beheren", cells: [JA, JA, JA, NEE, NEE] },
    { label: "Beloningen bekijken", cells: [JA, JA, JA, JA, JA] },
    { label: "Functionering / Beoordeling / Jaarplan", cells: [JA, JA, JA, JA_AFDELING, NEE] },
    { label: "Beloning (Jaaraward) toekennen", cells: [JA, JA, JA, NEE, NEE] },
    { label: "Applicaties", cells: [JA, JA, JA, JA, JA] },
    { label: "Rapporten", cells: [JA, JA, JA, JA, NEE] },
    { label: "Beheer panel", cells: [JA, JA, NEE, NEE, NEE] },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Overzicht van alle rechten per rol. <span className="text-amber-600 dark:text-amber-400 font-semibold">✓ afd.</span> betekent: alleen voor medewerkers van de eigen afdeling.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left py-2 px-3 font-semibold text-muted-foreground w-[200px]">Module / Functie</th>
              {rollen.map(r => (
                <th key={r} className="text-center py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                <td className="py-2 px-3 font-medium text-foreground">{row.label}</td>
                {row.cells.map((cell, j) => (
                  <td key={j} className="py-2 px-2 text-center">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground italic">
        Moduletoegang wordt ook bepaald door de toegewezen modules per medewerker in het Beheer panel.
      </p>
    </div>
  );
}

const helpContent: Record<string, { title: string; content: string }> = {
  "/": {
    title: "Dashboard",
    content: `Het Dashboard geeft u een overzicht van de belangrijkste informatie binnen uw organisatie.

\u2022 Bovenaan ziet u statistieken over het aantal medewerkers, afdelingen en openstaande verlofaanvragen.
\u2022 Recente aankondigingen worden getoond zodat u snel op de hoogte bent van het laatste nieuws.
\u2022 De agenda toont aankomende evenementen en belangrijke data.
\u2022 Vandaag afwezige medewerkers zijn direct zichtbaar op het dashboard.
\u2022 U kunt direct doorklikken naar de verschillende modules via de zijbalk.
\u2022 Een rode badge op een module in de zijbalk betekent dat er nieuwe items zijn sinds uw laatste bezoek.
\u2022 Beheerder en Directeur kunnen de hero-achtergrondafbeelding van het dashboard wijzigen via de foto-knop bovenaan.

\u2500\u2500 MIJN WERKTIJDEN PRESTATIES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Dit onderdeel is uitsluitend zichtbaar voor medewerkers (niet voor Beheerder, Manager of Directeur). Het toont een persoonlijk overzicht van de prikklok-naleving over de afgelopen 6 maanden.

Kolommen:
\u2022 Maand \u2014 de kalendermaand, huidig maand is blauw gemarkeerd.
\u2022 Niet geklokt \u2014 het aantal werkdagen (ma\u2013vr) waarop u aanwezig was maar \u00e9\u00e9n of meer verplichte bloktijden niet heeft nageleefd. Dit zijn dagen m\u00e9t prikklokregistraties maar met een gemiste blok 1, 2, 3 of 4.
\u2022 Te laat \u2014 het totaal aantal keren dat een inklokregistratie na 08:00 viel (blok 1-venster: 07:00\u201308:00). Per dag kunnen meerdere te-laat registraties worden geteld.
\u2022 Te vroeg weg \u2014 het totaal aantal keren dat een uitklokregistratie v\u00f3\u00f3r het blok 4-venster viel (16:45 ma\u2013do / 16:30 vr), zonder goedgekeurde afwezigheid.
\u2022 Uren \u2014 het gecumuleerde urensaldo (positief = meer gewerkt, negatief = minder gewerkt dan de norm).
\u2022 Min \u2014 de resterende minuten van het urensaldo.

Kleuren:
\u2022 Groen = goed (0 overtredingen of positief saldo).
\u2022 Oranje = aandacht nodig (1\u20132 overtredingen).
\u2022 Rood = actie vereist (3 of meer overtredingen, of negatief saldo).

Berekeningslogica:
\u2022 Alleen werkdagen (ma\u2013vr) met prikklokregistraties worden meegeteld.
\u2022 Goedgekeurde afwezigheidsdagen (vakantie, ziekte, BVVD) tellen niet mee als tekort.
\u2022 Pauzetijd (12:00\u201313:30) wordt automatisch in mindering gebracht op de gewerkte tijd.
\u2022 Norm: 8 uur per dag (ma\u2013do) en 7,5 uur per dag (vr).
\u2022 De gegevens zijn direct afgeleid uit de prikklokregistraties in de Werktijden-module en gebruiken exact dezelfde berekeningslogica als de Analyse-tab aldaar.`,
  },
  "/kalender": {
    title: "Kalender",
    content: `De Kalender module biedt een overzicht van alle evenementen, feestdagen en snipperdagen.

\u2022 Bekijk evenementen per maand. Klik op een datum om de details van die dag te bekijken.
\u2022 Bij de dagdetails wordt de profielfoto (avatar) van de aanmaker van elk evenement getoond.
\u2022 Gebruik de pijltjes links/rechts om door de maanden te navigeren.
\u2022 Beheerder, Beheerder AZ, Directeur en Manager kunnen evenementen toevoegen, bewerken en verwijderen via de \u201cNieuw Evenement\u201d knop.
\u2022 Categorie\u00ebn: vergadering, training, sociaal en deadline \u2014 elk met een eigen kleur.
\u2022 Offici\u00eble feestdagen (groen) kunnen door beheerders ge\u00fcpload worden via CSV of handmatig worden toegevoegd per jaar.
\u2022 Snipperdagen (rood) zijn verplichte vrije dagen die automatisch worden afgetrokken van ieders vakantiesaldo.
\u2022 Verjaardagen van medewerkers worden automatisch getoond (taart-icoon).
\u2022 Een rode badge in de zijbalk geeft aan dat er nieuwe evenementen of snipperdagen zijn toegevoegd deze maand.`,
  },
  "/aankondigingen": {
    title: "Aankondigingen",
    content: `Aankondigingen is het communicatiecentrum van de organisatie.

\u2022 Bekijk alle aankondigingen gesorteerd op datum. Vastgepinde aankondigingen staan altijd bovenaan.
\u2022 Aankondigingen kunnen de prioriteit \u201cHoog\u201d krijgen (rood label) of geen prioriteit (standaard).
\u2022 Beheerder, Beheerder AZ en Directeur kunnen aankondigingen aanmaken met een PDF-bijlage en deze vastzetten bovenaan de lijst.
\u2022 Managers en Medewerkers kunnen aankondigingen alleen bekijken, niet aanmaken.
\u2022 Het tabblad \u201cBerichten\u201d bevat directe communicatie: Beheerder, Beheerder AZ, Directeur en Manager kunnen berichten sturen naar medewerkers.
\u2022 Medewerkers ontvangen berichten en kunnen daarop reageren.
\u2022 Het tabblad \u201cNieuwsbrief\u201d toont ge\u00fcploade nieuwsbrieven (PDF). Beheerder, Beheerder AZ en Directeur kunnen nieuwe nieuwsbrieven uploaden.
\u2022 Een rode badge in de zijbalk geeft aan dat er nieuwe aankondigingen of berichten zijn sinds uw laatste bezoek.`,
  },
  "/organisatie": {
    title: "Organisatie",
    content: `De Organisatie module bevat alle informatie over de structuur van het bedrijf.

\u2022 Afdelingen: Overzicht van alle afdelingen met managers en het aantal medewerkers per afdeling.
\u2022 AO-Procedures: Administratieve procedures per afdeling. Beheerders kunnen procedures aanmaken met stapsgewijze instructies.
\u2022 Organogram: Visueel organisatieschema dat de hi\u00ebrarchie toont met de directeur bovenaan, managers per afdeling en medewerkers daaronder. Inclusief pasfoto per medewerker.
\u2022 CAO Info: Informatie over de collectieve arbeidsovereenkomst, gegroepeerd per categorie. Documenten zijn direct te downloaden.
\u2022 Wetgeving: Relevante wet- en regelgeving gegroepeerd per categorie, met directe links naar externe bronnen.
\u2022 Instructies & Huishoudelijk Reglement: Interne werkinstructies en het bedrijfsreglement zijn hier raadpleegbaar als PDF.`,
  },
  "/personalia": {
    title: "Personalia",
    content: `Personalia is het medewerkersoverzicht van de organisatie.

\u2022 Bekijk alle medewerkers met hun naam, functie, afdeling, e-mail en contactgegevens.
\u2022 Gebruik de zoekbalk om snel een specifieke medewerker te vinden op naam, functie of afdeling.
\u2022 Beheerder en Directeur kunnen nieuwe medewerkers toevoegen en alle persoonlijke gegevens bewerken: voornamen, voorvoegsel, achternaam, e-mail, afdeling, functie, datum in dienst, geboortedatum, toestelnummer, cedula-nr, kadaster-ID, telefoon- en mobielnummer en adres.
\u2022 Medewerkers kunnen actief of inactief worden gezet via de \u201cUit Dienst\u201d knop. Inactieve medewerkers zijn zichtbaar op het tabblad \u201cInactief\u201d.
\u2022 Per medewerker is de functiehistorie (loopbaanpad) inzichtelijk via het tabblad \u201cLoopbaan\u201d, inclusief eerdere functies met data.
\u2022 Pasfoto\u2019s worden beheerd via het Beheer panel (Camera-knop per medewerker).`,
  },
  "/verzuim": {
    title: "Verzuim",
    content: `De Verzuim module beheert alle verlof- en afwezigheidsaanvragen voor de hele organisatie.

Meldingen:
\u2022 Dien zelf een verlofaanvraag in via \u201cNieuw Verzoek\u201d: kies het type (Vakantie, Ziekte, BVVD, Geoorloofd of Ongeoorloofd), de periode en eventueel een reden.
\u2022 BVVD (Bijzonder Verlof en Vakantie Dagen): verlof met vooraf gedefinieerde redenen zoals huwelijk, overlijden, bevalling of verhuizing. Geef altijd een reden op.
\u2022 Na indiening is de aanvraag zichtbaar met status \u201cIn behandeling\u201d (geel). Na beoordeling verandert de status naar Goedgekeurd (groen) of Afgewezen (rood).
\u2022 Gecanceld (oranje): een goedgekeurde aanvraag is handmatig geannuleerd door een beheerder.
\u2022 Beheerder, Beheerder AZ en Directeur zien en beheren aanvragen van alle afdelingen.
\u2022 Manager ziet en beheert alleen aanvragen van medewerkers uit de eigen afdeling.
\u2022 Meerdere aanvragen tegelijk goedkeuren: gebruik de selectievakjes per aanvraag en klik \u201cAlles Goedkeuren\u201d.
\u2022 Afwezigheidsrapport: PDF-overzicht van alle afwezigheden per afdeling en medewerker, filterbaar op periode.

Overzicht:
\u2022 Toont alle verwerkte aanvragen: goedgekeurd, afgewezen en gecanceld.
\u2022 Gecancelde aanvragen zijn klikbaar \u2014 klik op \u201cdetails\u201d om de annuleringsreden te bekijken.
\u2022 Per-dag annuleringen verschijnen als aparte rijen met een oranje \u201cdag\u201d markering en de specifieke datum.

Vakantiesaldo:
\u2022 Recht: het aantal vakantiedagen waarop een medewerker recht heeft per 1 januari van het huidige jaar.
\u2022 Saldo Oud: het resterende saldo van het vorige jaar (per 31 december), automatisch overgedragen.
\u2022 Totaal: Recht + Saldo Oud \u2014 het totale beschikbare saldo aan het begin van het jaar.
\u2022 Saldo Nieuw: het resterende saldo na aftrek van goedgekeurde vakantiedagen, geplande dagen en snipperdagen.
\u2022 Beheerder, Beheerder AZ en Directeur passen via \u201cVakantierecht Instellen\u201d het Recht en Saldo Oud per medewerker aan.
\u2022 Snipperdagen: verplichte vrije dagen toegevoegd door beheerders; worden automatisch van ieders saldo afgetrokken.
\u2022 Manager ziet alleen het vakantiesaldo van de eigen afdeling.

Cancel Verzuim:
\u2022 Alleen toegankelijk voor Beheerder, Beheerder AZ en Directeur.
\u2022 Selecteer een afdeling en medewerker om de verlofkalender te tonen.
\u2022 Klik op een specifieke dag (vakantie, ziekte of BVVD) in de kalender om die dag te annuleren.
\u2022 Per annulering kan een reden worden opgegeven.
\u2022 Bij annulering van een vakantiedag wordt automatisch 1 dag teruggestort op het vakantiesaldo van de medewerker.
\u2022 Bij annulering van een ziektedag of BVVD-dag heeft dit geen effect op het vakantiesaldo.
\u2022 Alle gecancelde dagen zijn zichtbaar in de tabel \u201cGecancelde dagen\u201d onderaan de kalender.`,
  },
  "/beloningen": {
    title: "Beloningen",
    content: `De Beloningen module bevat vier onderdelen voor prestatiebeheer.

Functionering:
\u2022 Functioneringsgesprekken per medewerker per jaar. Bevat ontwikkelpunten, afspraken en opmerkingen. Filterbaar op jaar.
\u2022 Beheerder, Beheerder AZ en Directeur kunnen formulieren invullen voor alle medewerkers.
\u2022 Manager kan functioneringsgesprekken invullen en beheren voor medewerkers uit de eigen afdeling.
\u2022 Medewerkers zien alleen hun eigen functioneringsgesprekken (alleen-lezen).

Beoordeling:
\u2022 Beoordelingsgesprekken op basis van competenties per functie (score 1\u20135 per competentie). Totaal en gemiddelde worden automatisch berekend.
\u2022 Competenties instellen en beheren: alleen toegankelijk voor Beheerder, Beheerder AZ en Directeur.
\u2022 Beheerder, Beheerder AZ en Directeur kunnen beoordelingen invullen voor alle medewerkers.
\u2022 Manager kan beoordelingen invullen voor medewerkers uit de eigen afdeling.

Jaarplan:
\u2022 Jaarlijkse planning per medewerker met voortgangsstatussen: niet gestart, in uitvoering, op schema, vertraagd, afgerond of geannuleerd.
\u2022 Beheerder, Beheerder AZ en Directeur kiezen vrij een afdeling en medewerker.
\u2022 Manager kiest automatisch de eigen afdeling en selecteert een medewerker uit de eigen afdeling.

Beloning (Jaaraward):
\u2022 Puntensysteem waarmee medewerkers beloond worden. Het leaderboard toont de ranglijst van alle medewerkers.
\u2022 Alleen Beheerder, Beheerder AZ en Directeur kunnen beloningspunten toekennen of verwijderen.
\u2022 Alle medewerkers kunnen het leaderboard bekijken.`,
  },
  "/applicaties": {
    title: "Applicaties",
    content: `De Applicaties module beheert toegang tot externe applicaties en systemen.

\u2022 Bekijk alle beschikbare applicaties met hun beschrijving en directe link.
\u2022 Beheerder, Beheerder AZ en Directeur kunnen nieuwe applicaties toevoegen, bewerken of verwijderen.
\u2022 Per applicatie kan worden ingesteld welke medewerkers toegang hebben.
\u2022 Klik op een applicatie-tegel om deze te openen in een nieuw venster.`,
  },
  "/rapporten": {
    title: "Rapporten",
    content: `De Rapporten module biedt afdrukbare overzichten van medewerkergegevens.

\u2022 Medewerkersinformatie: volledig overzicht van alle medewerkers met persoonsgegevens, contactgegevens en functie-informatie. Afdrukbaar via de \u201cAfdrukken\u201d knop.
\u2022 Verjaardagen: overzicht van alle medewerkers gesorteerd op geboortedatum (dag en maand). Handig voor jubileumplanning.
\u2022 Dienstjaren: overzicht van het aantal dienstjaren per medewerker, berekend op basis van de datum in dienst.
\u2022 Rapporten zijn toegankelijk voor Beheerder, Beheerder AZ, Directeur en Manager.
\u2022 De hero-achtergrondafbeelding van de Rapporten pagina kan door Beheerder en Directeur worden gewijzigd via het Beheer panel.`,
  },
  "/beheer": {
    title: "Beheer",
    content: `Het Beheer panel is alleen toegankelijk voor Beheerder (admin) en Directeur.

\u2022 Gebruikers & Rechten: Beheer de toegangsrechten van elke medewerker. Per medewerker kunt u instellen welke modules zichtbaar zijn in de zijbalk. Gebruik \u201cAlles selecteren\u201d of \u201cAlles wissen\u201d voor snelle aanpassingen.
\u2022 Pasfoto: Upload of wijzig de profielfoto van een medewerker via de \u201cPasfoto\u201d knop (camera-icoon) naast de medewerker in de lijst.
\u2022 Wachtwoord resetten: Stel een nieuw wachtwoord in voor een medewerker via de \u201cWachtwoord\u201d knop. Het wachtwoord moet minimaal 8 tekens lang zijn.
\u2022 Inlogpagina achtergrond: Upload een nieuwe achtergrondafbeelding voor het inlogscherm.
\u2022 Rapporten pagina achtergrond: Upload een nieuwe hero-afbeelding voor de Rapporten pagina.
\u2022 Afdelingen: Beheer afdelingen \u2014 aanmaken, bewerken, verwijderen en een manager toewijzen.
\u2022 Functies: Beheer functies/job-titels \u2014 aanmaken, bewerken, verwijderen en een functiebeschrijving uploaden (PDF).

Rollen:
\u2022 Directeur: volledige toegang tot alle modules en kan alle verlofaanvragen goedkeuren, inclusief die van managers en beheerders.
\u2022 Beheerder (admin): volledige toegang tot alle modules inclusief Beheer panel. Kan verlofaanvragen van alle medewerkers goedkeuren.
\u2022 Beheerder AZ (manager_az): toegang tot bijna alle modules (uitgezonderd Beheer panel). Kan verlofaanvragen van alle medewerkers goedkeuren en heeft volledige schrijfrechten in Beloningen voor alle medewerkers.
\u2022 Manager: toegang tot de meeste modules (uitgezonderd Beheer panel). Beheert verlofaanvragen en vult Beloningen in uitsluitend voor medewerkers uit de eigen afdeling. Kan geen aankondigingen aanmaken.
\u2022 Medewerker: toegang tot Dashboard, Kalender, Aankondigingen, Verzuim, Beloningen en Applicaties (conform de toegewezen modules).

Zie het rechtenoverzicht hieronder voor een volledig overzicht per module en rol, en de zichtbaarheidstabel voor de Organisatie module.

──────────────────────────────────────────
DATABASETABELLEN \u2014 OVERZICHT
──────────────────────────────────────────

PERSONEEL & TOEGANG
\u25ba users \u2014 Medewerkers (gebruikers van het systeem)
  Velden: id, username, password, full_name, email, role (directeur/admin/manager/manager_az/employee/tijdelijk), department, avatar, active, permissions (array), start_date, end_date, birth_date, vacation_days_total, vacation_days_saldo_oud, vacation_days_cancel, phone_extension, functie, kadaster_id, cedula_nr, telefoonnr, mobielnr, adres, voornamen, voorvoegsel, achternaam.

\u25ba departments \u2014 Afdelingen binnen de organisatie
  Velden: id, name, description, manager_id (verwijzing naar users).

\u25ba job_functions \u2014 Functies / job-titels
  Velden: id, name, description, department_id, sort_order, description_file_path (pad naar PDF-functiebeschrijving).

\u25ba position_history \u2014 Functiehistorie per medewerker (loopbaan)
  Velden: id, user_id, function_title, start_date, end_date, salary, notes.

\u25ba applications \u2014 Externe applicaties en systemen
  Velden: id, name, description, url, path, icon.

\u25ba app_access \u2014 Toegangsrechten per medewerker per applicatie
  Velden: id, user_id, application_id, access_level, granted_at.

COMMUNICATIE
\u25ba announcements \u2014 Aankondigingen (nieuwsberichten)
  Velden: id, title, content, priority, pinned, pdf_url, created_by, created_at, archived.

\u25ba messages \u2014 Directe berichten tussen medewerkers
  Velden: id, from_user_id, to_user_id, subject, content, reply, replied_at, read, created_at.

\u25ba events \u2014 Evenementen in de kalender
  Velden: id, title, description, date, end_date, time, location, category (vergadering/training/sociaal/deadline), created_by, created_at.

\u25ba official_holidays \u2014 Offici\u00eble feestdagen per jaar
  Velden: id, name, date, year, created_by.

\u25ba snipperdagen \u2014 Verplichte vrije dagen (worden van vakantiesaldo afgetrokken)
  Velden: id, name, date, year, created_by, created_at.

VERZUIM & VERLOF
\u25ba absences \u2014 Verzuim- en verlofmeldingen
  Velden: id, user_id, type (sick/vacation/personal/other/bvvd/persoonlijk), start_date, end_date, reason, bvvd_reason, half_day, status (pending/approved/rejected/cancelled), approved_by, deduct_vacation, cancel_reason, persoonlijk_besluit (geoorloofd/ongeoorloofd), created_at.

\u25ba absence_cancellations \u2014 Per-dag annuleringen van een goedgekeurde verlofperiode
  Velden: id, absence_id, cancelled_date, cancel_reason, cancelled_by, affects_balance (of vakantiedagensaldo wordt hersteld), created_at.

BELONINGEN & BEOORDELING
\u25ba functionering_reviews \u2014 Functioneringsgesprekken per medewerker per jaar
  Velden: id, user_id, year, medewerker, functie, afdeling, leidinggevende, datum, periode, terugblik_taken, terugblik_resultaten, terugblik_knelpunten, werkinhoud, samenwerking, communicatie, arbeidsomstandigheden, persoonlijke_ontwikkeling, scholingswensen, doelstelling_1/2/3 + termijnen, afspraken, opmerking_medewerker, opmerking_leidinggevende, created_by, created_at, updated_at.

\u25ba competencies \u2014 Competenties per functie (gebruikt bij beoordeling)
  Velden: id, functie, name, norm_1 t/m norm_5 (normbeschrijving per score), sort_order.

\u25ba beoordeling_reviews \u2014 Beoordelingsgesprekken per medewerker per jaar
  Velden: id, user_id, year, medewerker, functie, afdeling, beoordelaar, datum, periode, total_score, afspraken, opmerking_medewerker, opmerking_beoordelaar, created_by, created_at, updated_at.

\u25ba beoordeling_scores \u2014 Scores per competentie per beoordelingsgesprek
  Velden: id, review_id, competency_id, score (1\u20135), toelichting.

\u25ba jaarplan_items \u2014 Jaarplannen / doelstellingen per medewerker
  Velden: id, user_id, year, afspraken, start_datum, eind_datum, voortgang, status (niet gestart/in uitvoering/op schema/vertraagd/afgerond/geannuleerd), created_by, created_at, updated_at.

\u25ba rewards \u2014 Beloningspunten per medewerker
  Velden: id, user_id, points, reason, awarded_by, awarded_at.

\u25ba yearly_awards \u2014 Jaarawards (bijv. medewerker van het jaar)
  Velden: id, year, type, name, photo, awarded_by, awarded_at.

\u25ba personal_development \u2014 Persoonlijke ontwikkeling / gevolgde trainingen
  Velden: id, user_id, training_name, start_date, end_date, completed.

ORGANISATIE & DOCUMENTEN
\u25ba ao_procedures \u2014 Administratieve procedures per afdeling
  Velden: id, department_id, title, description.

\u25ba ao_instructions \u2014 Stapsgewijze instructies bij een AO-procedure
  Velden: id, procedure_id, title, content, sort_order.

\u25ba legislation_links \u2014 Wetgevingslinks en externe bronnen
  Velden: id, title, url, description, category, pdf_url.

\u25ba cao_documents \u2014 CAO-documenten per hoofdstuk
  Velden: id, chapter_number, title, document_url.

PRODUCTIE \u2014 KARTOGRAFIE (KM Binnen)
\u25ba maand_prod_kartograaf \u2014 Maandelijkse productie per kartograaf
  Velden: id, jaar, maand, kartograaf, mbr, kad_spl, gr_uitz, ex_pl, plot_coor, losse_mbr.

\u25ba maand_prod_samenvatting \u2014 Maandoverzicht KM Binnen (kartografen)
  Velden: id, jaar, maand, binnengekomen, aantal_kartografen.

\u25ba kartografie_productie \u2014 Kartografie productie import (KM Binnen totalen)
  Velden: id, jaar, maand, binnengekomen, afgehandeld, gemiddeld, kartografen.

\u25ba trend_kartografen_hist \u2014 Historische trend per kartograaf
  Velden: id, jaar, maand, egaleano, jpieters, nsambo, binnengekomen, afgehandeld.

PRODUCTIE \u2014 LANDMETERS (KM Buiten)
\u25ba maand_prod_landmeter \u2014 Maandelijkse productie per landmeter
  Velden: id, jaar, maand, landmeter, ex_uitb, meting, gr_uitz, l_meting, plot_inzage_coord.

\u25ba maand_prod_samenvatting_lm \u2014 Maandoverzicht KM Buiten (landmeters)
  Velden: id, jaar, maand, binnengekomen, aantal_landmeters, eilandgebied, particulier, grensuitzetting.

\u25ba trend_km_buiten \u2014 Trendcijfers KM Buiten per maand
  Velden: id, jaar, maand, binnengekomen, afgehandeld, uitbesteding, gemiddeld, landmeters.

PRODUCTIE \u2014 OPENBAAR REGISTER (OR)
\u25ba maand_prod_or_info \u2014 Maandelijkse productie OR per productsoort
  Velden: id, jaar, maand, inzage_or, bulkdata, verkorte_inzage, schriftelijke_inzage, kopie_akte, her_inzage, na_inzage, kadastrale_legger, verklaring_eensluidend, verklaring_geen_or, getuigschrift_volgende, getuigschrift_or, aktes, inschrijvingen, doorhalingen, opheffingen, beslagen, cessies.

\u25ba trend_or_info \u2014 Trendcijfers OR inzagen per maand
  Velden: id, jaar, maand, inzagen, her_inzage, na_inzage, kadastaal_legger, verklaring, getuigschrift.

\u25ba trend_or_algemeen \u2014 Trendcijfers OR algemeen (aktes, inschrijvingen etc.)
  Velden: id, jaar, maand, aktes, inschrijvingen, doorhalingen, opheffingen, beslagen, cessies.

\u25ba maand_prod_or_notaris \u2014 Maandelijkse OR-productie per notaris
  Velden: id, jaar, maand, notaris_key, aktes, inschrijvingen, doorhalingen, opheffingen, beslagen, cessies, sort_order.

\u25ba trend_or_notaris \u2014 Trendcijfers per notaris
  Velden: id, jaar, maand, notaris_key, waarde.

PRODUCTIE \u2014 KM INFO
\u25ba maand_prod_km_info \u2014 Maandelijkse productie KM Info per productsoort
  Velden: id, jaar, maand, topo_kaarten, plot_overzicht, plot_grens_uitz, afdrukken_kaarten, sit_a4, sit_a3, reg_meetbrief, reg_extractplan, inzage_kad, uur_tarieven, digitale_bestanden, blok_maten, kopie_veldwerk, coordinaten, hulp_kaart, terrein_onderzoek, proces_verbaal.

\u25ba trend_km_info \u2014 Trendcijfers KM Info per maand
  Velden: id, jaar, maand, kkp, db, sa, rm, re, km, ik.

SYSTEEM
\u25ba site_settings \u2014 Systeeminstellingen (sleutel-waarde paren)
  Velden: key (primaire sleutel), value, updated_at. Gebruikt voor o.a. achtergrondafbeeldingen.

\u25ba help_content \u2014 Help-teksten per paginaroute (bewerkbaar via Help-knop)
  Velden: id, page_route (uniek, bijv. /beheer), title, content.`,
  },
  "/productie": {
    title: "Productie",
    content: `De Productie module toont maandelijkse productiecijfers en trendgrafieken per afdeling.

Wat ziet u als Kartograaf:
\u2022 Tab \u201cMijn productie\u201d \u2014 uitsluitend uw eigen productierij (alleen-lezen). De kolommen tonen uw ingevoerde aantallen per productsoort voor de geselecteerde maand en jaar.
\u2022 Tab \u201cTrend KM Binnen\u201d \u2014 het afdelingsoverzicht van KM Binnen (kartografie): totalen binnengekomen en afgehandeld per jaar, gemiddeld aantal kartografen en de jaarlijkse trendgrafiek.
\u2022 U kunt geen gegevens bewerken of opslaan; productiedata wordt door de beheerder of manager ingevoerd.

Wat ziet u als Landmeter:
\u2022 Tab \u201cMijn productie\u201d \u2014 uitsluitend uw eigen productierij (alleen-lezen). De kolommen tonen uw aantallen per productsoort (Ext. Uitbesteding, Meting, Grensuitzetting, L-Meting, Plot/Inzage/Coörd.) voor de geselecteerde maand en jaar.
\u2022 Tab \u201cTrend KM Buiten\u201d \u2014 het afdelingsoverzicht van KM Buiten (landmeten): totalen binnengekomen en afgehandeld per jaar, inclusief uitbesteding en gemiddeld aantal landmeters.
\u2022 U kunt geen gegevens bewerken of opslaan; productiedata wordt door de beheerder of manager ingevoerd.

Naam-koppeling:
\u2022 Uw productierij wordt herkend op basis van uw naam in het formaat: eerste letter van voornaam + punt + spatie + achternaam (bijv. \u201cL. Francisca\u201d of \u201cJ. de Vries\u201d). Zorg dat uw naam in de productielijst exact dit formaat heeft.

Navigatie:
\u2022 Gebruik de \u201cPeriode t/m\u201d en \u201cJaarbereik\u201d selectors om een andere maand of periode te bekijken.
\u2022 Uw eigen productierij is altijd zichtbaar; rijen van collega\u2019s zijn verborgen.`,
  },
  "/werktijden": {
    title: "Werktijden",
    content: `De Werktijden module is het centrale dashboard voor prikklokdata. Importeer CSV-bestanden van het prikkloksysteem, bekijk individuele registraties en werkdagsessies, en analyseer het nalevingsgedrag van medewerkers per periode. Medewerkers hebben toegang tot de tab Correcties om correctieverzoeken in te dienen.

── BOVENSTE KPI-KAARTEN ──────────────────────

• Totaal records \u2014 het aantal prikklokregistraties (inklok + uitklok) dat in de database staat.
• Sessies \u2014 het totaal aantal werkdagsessies (\u00e9\u00e9n per medewerker per dag met minimaal \u00e9\u00e9n inklokregistratie).
• Verstuur waarschuwing \u2014 klikbare kaart die een bericht opstelt op basis van de analyse van de geselecteerde medewerker (zie Analyse). Grayed-out als er geen medewerker in de Analyse-tab is geselecteerd.
• Laatste import \u2014 datum en tijdstip van de meest recente CSV-import.

── TAB: IMPORT ───────────────────────────────

Sleep een CSV-bestand naar de uploadzone of klik om een bestand te kiezen.
• Ondersteunde kolommen: userid/pin (kadaster-ID), checktime/datetime (tijdstip), checktype/type (optioneel: in/out, 0/1, C/I).
• Separator: komma (,) of puntkomma (;).
• Datumformaten: ISO 8601 (yyyy-mm-dd), dd/mm/yyyy of dd-mm-yyyy.
• Zonder checktype-kolom: de registraties worden als afwisselend in/out verwerkt.
• Duplicaten worden automatisch overgeslagen op basis van userid + checktime.
• Importgeschiedenis: een klikbare tabel toont alle eerdere imports met bestandsnaam, tijdstip, aantal records, fouten, waarschuwingen en status. Klik op een rij om het logboek te filteren op die specifieke import.

── TAB: REGISTRATIES ─────────────────────────

Registraties zijn de ruwe prikklokgegevens zelf \u2014 elke afzonderlijke inklok- of uitklokregistratie die via een CSV-import is ingeladen. \u00c9\u00e9n rij = \u00e9\u00e9n keer dat iemand een kaart langs de lezer heeft gehaald.
• Filter op afdeling, medewerker of datum via de filters bovenaan.
• Kolommen: Log ID, Userid (kadaster-ID), Medewerker, Datum, Tijdstip, Type (inklok/uitklok).
• Verwijder een registratie via het prullenbak-icoon. Let op: dit kan de sessies en analyse be\u00efnvloeden.
• Maximaal 500 registraties worden tegelijk getoond; gebruik filters om te verfijnen.
• Beheerder, Beheerder AZ, Directeur en Manager kunnen registraties exporteren als CSV of afdrukken.

── TAB: SESSIES ──────────────────────────────

Een sessie combineert alle registraties van \u00e9\u00e9n medewerker op \u00e9\u00e9n dag tot een werkdagoverzicht.
• Filter op afdeling en medewerker via de filters bovenaan.
• Kolommen: Medewerker, ID, Datum, Weekdag, Eerste inklok, Laatste uitklok, Werktijd, Aantal records, Status.
• Status onvolledig (oranje badge): een sessie heeft geen sluitend in/out-paar \u2014 de medewerker is mogelijk vergeten te klokken.
• Beheerder, Beheerder AZ, Directeur en Manager kunnen sessies exporteren als CSV of afdrukken.

── TAB: LOGBOEK ──────────────────────────────

Het logboek is het verwerkingsdagboek van het importproces \u2014 berichten die het systeem aanmaakt tijdens het verwerken van een CSV-import. Het bevat geen werkelijke werktijddata, maar laat zien wat er is gebeurd bij de verwerking.
• Info: normale verwerkingsstappen (record verwerkt, duplicaat overgeslagen, enz.).
• Waarschuwing: onverwachte maar verwerkbare situaties (onbekende userid, tijdstip buiten bereik).
• Fout: registraties die niet konden worden verwerkt (ongeldig tijdstip, ontbrekende kolommen).
• Zoek op berichttekst, userid of event-type (bijv. typ \u201cwarning\u201d voor alle waarschuwingen).
• Filter op een specifieke import door in de Importgeschiedenis op een rij te klikken.
• Klik op \u201cVernieuwen\u201d om de meest recente logregels op te halen.

Verschil samengevat: Registraties = de inhoud van de import; Logboek = het verhaal van hoe die import is verlopen.

── TAB: ANALYSE ──────────────────────────────

Gedetailleerde nalevingsanalyse per medewerker over een gekozen periode.

Stap 1 \u2014 Selecteer een medewerker via het dropdown-filter.
Stap 2 \u2014 Stel optioneel een Van- en T/m-datum in.

De analyse toont 5 KPI-kaarten:
• Verzuim te klokken \u2014 dagen waarop de medewerker wel aanwezig was (er zijn registraties) maar \u00e9\u00e9n of meer verplichte bloktijden niet correct heeft nageleefd.
• Te laat ingeklokt \u2014 totaal aantal inklokregistraties na 08:00 (per registratie geteld, niet per dag).
• Te vroeg uitgeklokt \u2014 totaal aantal uitklokregistraties v\u00f3\u00f3r het blok 4-venster, zonder goedgekeurde afwezigheid (per registratie geteld).
• Onvolledig \u2014 onvolledige in/out-paren (vergeten te klokken).
• Variabel saldo \u2014 gecumuleerd verschil in minuten/uren ten opzichte van de normwerktijden. Alleen werkdagen m\u00e9t registraties worden meegerekend; goedgekeurde afwezigheidsdagen tellen als 0.

Werkurenoverzicht:
• Tabel per werkdag met: datum, weekdag, inklok- en uitkloktijden, blokstatus (\u2713/\u2717 per blok), totale werktijd en verschil t.o.v. norm.
• Gebruik de knop \u201cToon alleen onvolledig\u201d om snel alle onvolledige registraties te filteren.
• Beheerder, Beheerder AZ, Directeur en Manager kunnen de analyse exporteren als CSV of afdrukken.

Bloktijden (norm voor alle medewerkers):
• Blok 1 \u2014 Inklokvenstster: 07:00\u201308:00
• Blok 2 \u2014 Uitklokvenstster pauze: 11:45\u201312:30
• Blok 3 \u2014 Terugkeer na pauze: 13:30\u201314:30
• Blok 4 \u2014 Einde werkdag: 16:30\u201318:00 (vr) / 16:45\u201318:00 (ma\u2013do)
• Pauzetijd (12:00\u201313:30) telt niet als werktijd.

Aanvullende secties:
• Te laat ingeklokt \u2014 volledig overzicht met datum en exacte inklokttijd.
• Te vroeg uitgeklokt \u2014 uitkloktijden v\u00f3\u00f3r het blok 4-venster, exclusief goedgekeurde afwezigheid.
• Te vroeg ingeklokt (v\u00f3\u00f3r 07:00) \u2014 alleen weergegeven als dit voorkomt in de geselecteerde periode.
• Pauze overzicht \u2014 alle geregistreerde pauzetijden met duur.
• Verzuim bloktijden \u2014 een dag-voor-dag detailtabel van bloktijdovertredingen.

\u26a0\ufe0f De metrics in de Analyse-tab zijn de bron van de gegevens die op het Dashboard worden getoond in de kaart \u201cMijn Werktijden Prestaties\u201d. Beide gebruiken exact dezelfde berekeningslogica.

── TAB: AFDELINGSOVERZICHT ──────────────────

Geaggregeerd overzicht van alle afdelingen over een gekozen periode.
• Stel een Van- en Tot-datum in (standaard: laatste 7 dagen).
• Per afdeling: totaal medewerkers, actief in periode, te laat (keer), te vroeg uitg. (keer), onvolledig (keer).
• Klik op een afdeling om de individuele medewerkers binnen die afdeling te zien met hun eigen statistieken.
• Exporteer het overzicht als CSV via de \u201cExport CSV\u201d knop.

── TAB: SIGNALEN ────────────────────────────

Drempelwaarschuwingen \u2014 identificeer automatisch medewerkers die in een gekozen periode de ingestelde drempelwaarden overschrijden.
• Stel de periode in (Van / Tot) en de drempelwaarden voor: Te laat (aantal keer), Te vroeg uitg. (aantal keer) en Onvolledig (aantal keer).
• Klik op \u201cAnalyseer\u201d om de berekening te starten.
• Medewerkers die \u00e9\u00e9n of meer drempelwaarden overschrijden verschijnen in de resultatenlijst met hun exacte tellingen.
• Gebruik dit tabblad voor periodieke controle en vroegtijdige signalering van patroonafwijkingen.

── TAB: CORRECTIES ──────────────────────────

Medewerkers en managers kunnen correctieverzoeken indienen voor ontbrekende of onjuiste prikklokregistraties.

Voor medewerkers:
• Klik op \u201cCorrectie aanvragen\u201d om een verzoek in te dienen.
• Vul in: kadaster-ID, datum, tijdstip en type (inklok of uitklok), plus een reden.
• Uw eigen verzoeken zijn zichtbaar met de status: In behandeling, Goedgekeurd of Afgewezen.

Voor Beheerder, Beheerder AZ, Directeur en Manager:
• Alle ingediende correctieverzoeken van alle medewerkers zijn zichtbaar.
• Keur een verzoek goed via de \u201cGoedkeuren\u201d knop \u2014 de registratie wordt automatisch aangemaakt in de database.
• Wijs een verzoek af via de \u201cAfwijzen\u201d knop.
• Goedgekeurde registraties zijn direct zichtbaar in de tabs Registraties en Sessies.

── VERSTUUR WAARSCHUWING ─────────────────────

Zodra een medewerker in de Analyse-tab is geselecteerd met beschikbare data:
• Klik op de \u201cVerstuur waarschuwing\u201d kaart (bovenaan de pagina).
• Er opent een dialoogvenster met een automatisch opgesteld bericht dat de geconstateerde overtredingen noemt: ontbrekende kloktijden, verzuim bloktijden, te laat ingeklokt, te vroeg uitgeklokt en negatief uurssaldo.
• Het bericht is bewerkbaar voor verzending.
• Na klikken op \u201cVerstuur\u201d ontvangt de medewerker het bericht in zijn/haar berichtenbox (Aankondigingen \u203a Berichten).

── TOEGANG ───────────────────────────────────

• Beheerder, Beheerder AZ, Directeur en Manager: volledige toegang tot alle tabs.
• Medewerker: alleen toegang tot de tab \u201cCorrecties\u201d om correctieverzoeken in te dienen en de eigen verzoeken te bekijken.`,
  },
  "/profiel": {
    title: "Mijn Profiel",
    content: `Op de profielpagina vindt u uw persoonlijke gegevens en overzichten.

\u2022 Bekijk uw persoonlijke informatie zoals naam, e-mail, afdeling, functie, startdatum en contactgegevens.
\u2022 Overzicht van uw verlofaanvragen met status (in behandeling, goedgekeurd, afgewezen, geannuleerd) en uw actueel vakantiedagensaldo.
\u2022 Bekijk uw beloningspunten en uw positie op het leaderboard.
\u2022 Overzicht van de modules waartoe u toegang heeft binnen het systeem.
\u2022 Uw loopbaanpad (functiehistorie) is hier inzichtelijk \u2014 inclusief eerdere functies met start- en einddatum.`,
  },
};

function Router() {
  const { user } = useAuth();
  const perms = user?.permissions || [];

  return (
    <Switch>
      {perms.includes("dashboard") && <Route path="/" component={DashboardPage} />}
      {perms.includes("kalender") && <Route path="/kalender" component={KalenderPage} />}
      {perms.includes("aankondigingen") && <Route path="/aankondigingen" component={AankondigingenPage} />}
      {perms.includes("organisatie") && <Route path="/organisatie" component={OrganisatiePage} />}
      {perms.includes("personalia") && <Route path="/personalia" component={PersonaliaPage} />}
      {perms.includes("verzuim") && <Route path="/verzuim" component={VerzuimPage} />}
      {perms.includes("beloningen") && <Route path="/beloningen" component={BeloningenPage} />}
      {perms.includes("applicaties") && <Route path="/applicaties" component={ApplicatiesPage} />}
      {perms.includes("productie") && <Route path="/productie" component={ProductiePage} />}
      {perms.includes("rapporten") && <Route path="/rapporten" component={RapportenPage} />}
      {perms.includes("werktijden") && <Route path="/werktijden" component={WerktijdenPage} />}
      {perms.includes("beheer") && <Route path="/beheer" component={BeheerPage} />}
      <Route path="/profiel" component={ProfielPage} />
      <Route path="/" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const { data: dbHelpContent } = useQuery<HelpContent[]>({
    queryKey: ["/api/help-content"],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { pageRoute: string; title: string; content: string }) => {
      await apiRequest("PUT", "/api/help-content", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-content"] });
      toast({ title: "Help-tekst opgeslagen" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "Opslaan mislukt", variant: "destructive" });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const isAdmin = isAdminRole(user.role);
  const fallback = helpContent[location] || helpContent["/"];
  const dbEntry = dbHelpContent?.find(h => h.pageRoute === location);
  const currentHelp = dbEntry ? { title: dbEntry.title, content: dbEntry.content } : fallback;

  const handleEdit = () => {
    setEditContent(currentHelp.content);
    setEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      pageRoute: location,
      title: currentHelp.title,
      content: editContent,
    });
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-3 border-b sticky top-0 z-50 bg-background print-hide">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setHelpOpen(true); setEditing(false); }}
                data-testid="button-help"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden main-content-area">
            <Router />
          </main>
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className={`max-h-[85vh] overflow-y-auto ${location === "/beheer" ? "max-w-3xl" : "max-w-lg"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help — {currentHelp.title}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={12}
                className="text-sm"
                data-testid="textarea-help-edit"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuleren</Button>
                <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-help">
                  <Save className="h-4 w-4 mr-1" />
                  {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed" data-testid="text-help-content">
                {currentHelp.content}
              </div>
              {location === "/beheer" && (
                <div className="mt-4 pt-4 border-t space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Rechtenoverzicht per rol</h3>
                    <RollenRechtentabel />
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Organisatie — zichtbaarheid documenten</h3>
                    <OrganisatieZichtbaarheidTabel />
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="flex justify-end pt-2 border-t mt-2">
                  <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-help">
                    <Pencil className="h-4 w-4 mr-1" />
                    Bewerken
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
