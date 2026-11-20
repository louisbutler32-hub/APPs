/**
 * Built-in AI estimates: rough pay ranges for common jobs in countries without official figures on
 * the site. They were written by an AI from general knowledge, with no web search, in
 * `GENERATED`. They ship inside the site, so showing one costs nothing and needs no API key.
 *
 * What they are not: official figures, or checked against live sources. They are shown with the
 * "AI estimate" label, as a range with no percentage rank, like every other estimate. They go
 * stale: regenerate them at least once a year, and sooner for a country with fast-moving prices.
 * Countries whose currencies change value quickly are left out on purpose, because a figure
 * written months ago would mislead.
 *
 * Figures are yearly full-time pay before tax, in thousands of local currency, as
 * lower/typical/upper, in the order of BUILTIN_COUNTRIES. Each country's lower figures sit at or
 * above its rough full-time minimum wage at the time of writing.
 */
import type { Estimate } from "./estimate-shared";

export const GENERATED = "November 2026";

/** Countries with built-in estimates, in the column order of the table below. */
export const BUILTIN_COUNTRIES = ["AU", "NZ", "CA", "DE", "FR", "ES", "IT", "JP", "IN", "ZA"] as const;

const CURRENCY: Record<(typeof BUILTIN_COUNTRIES)[number], string> = { AU: "AUD", NZ: "NZD", CA: "CAD", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", JP: "JPY", IN: "INR", ZA: "ZAR" };

/** Where pay is well documented and fairly uniform, the estimate is steadier. Elsewhere it is a loose guide. */
const STEADIER = new Set<string>(["AU", "NZ", "CA"]);

type Row = [title: string, aliases: string[], figures: string];

//                                                              AU          NZ          CA          DE        FR        ES        IT        JP              IN            ZA
const ROWS: Row[] = [
  ["Registered nurse", ["nurse", "rn", "staff nurse"], "80/92/105 75/85/100 72/84/98 40/46/53 28/33/40 26/31/37 26/30/35 4200/4900/5600 240/360/540 250/340/450"],
  ["Primary school teacher", ["teacher", "primary teacher", "elementary teacher", "elementary school teacher"], "82/95/110 65/82/97 60/78/98 48/56/65 26/32/40 28/33/39 26/30/35 4000/5200/6500 200/350/600 260/340/440"],
  ["Secondary school teacher", ["secondary teacher", "high school teacher"], "84/98/113 67/85/100 62/82/100 52/61/70 28/35/43 30/36/42 27/32/37 4200/5500/6800 240/420/700 280/360/460"],
  ["Software developer", ["software engineer", "developer", "programmer", "web developer"], "95/120/150 85/110/140 80/100/130 55/68/82 42/52/65 30/40/52 30/38/48 4500/6000/8000 500/900/1600 400/600/850"],
  ["Accountant", [], "75/92/115 65/85/110 58/72/92 45/56/70 35/43/55 26/33/42 28/35/45 4000/5200/6800 300/500/900 280/420/600"],
  ["Electrician", ["sparky"], "75/92/115 65/80/95 58/72/90 36/43/50 26/31/37 21/25/30 25/29/34 3600/4500/5500 180/280/420 180/280/400"],
  ["Plumber", [], "72/90/110 65/80/95 55/70/88 35/42/49 25/30/36 20/24/29 24/28/33 3500/4400/5400 160/250/380 170/260/380"],
  ["Chef", ["cook", "line cook", "sous chef"], "62/72/85 55/65/78 40/48/58 30/36/44 25/30/38 20/24/30 23/27/33 3200/4000/5000 200/350/600 140/220/340"],
  ["Waiter", ["waitress", "server", "waitstaff"], "52/58/65 49/52/58 34/37/43 29/31/35 22/24/27 17/19/22 20/23/26 2600/3100/3700 120/180/260 70/90/125"],
  ["Barista", [], "52/57/63 49/52/57 34/36/41 29/30/34 22/23/26 17/19/21 20/22/25 2500/3000/3500 140/200/280 70/90/125"],
  ["Retail sales assistant", ["sales assistant", "shop assistant", "retail assistant", "retail worker", "sales associate"], "52/58/65 49/52/58 34/37/43 29/32/37 22/24/27 17/20/23 21/24/27 2700/3200/3900 130/190/270 70/95/135"],
  ["Cashier", ["checkout operator", "checkout assistant"], "51/56/62 49/51/56 33/35/39 29/31/35 22/23/26 17/19/22 20/23/26 2500/2900/3400 120/170/240 70/85/115"],
  ["Store manager", ["retail manager", "shop manager"], "65/78/95 60/72/88 48/60/75 38/46/56 28/34/42 23/28/35 28/34/42 3800/4800/6000 300/480/750 180/280/420"],
  ["Customer service representative", ["customer service", "customer service agent", "call centre agent", "call center agent"], "58/65/74 52/58/66 38/45/53 30/35/41 23/26/31 18/21/25 22/25/29 3000/3600/4300 200/300/420 110/160/230"],
  ["Receptionist", [], "55/62/70 50/56/63 36/42/48 29/33/38 22/25/29 17/20/23 21/24/27 2800/3300/3900 150/220/300 90/140/200"],
  ["Administrative assistant", ["admin assistant", "administrator", "office administrator", "office assistant", "admin"], "60/68/77 52/60/68 40/47/55 32/38/45 24/28/33 18/22/26 23/27/31 3000/3600/4300 180/260/380 120/180/260"],
  ["Truck driver", ["lorry driver", "hgv driver", "heavy vehicle driver"], "65/78/95 58/68/80 48/58/70 32/37/43 24/28/32 20/24/28 25/29/33 3800/4600/5500 180/260/380 110/170/250"],
  ["Delivery driver", ["courier", "van driver"], "55/62/72 50/56/64 36/42/50 29/32/36 22/24/28 17/20/23 21/24/28 3000/3700/4400 150/220/320 75/115/165"],
  ["Warehouse worker", ["warehouse operative", "storeperson", "picker packer", "warehouse assistant"], "55/62/70 50/55/62 36/42/48 29/33/38 22/24/28 17/20/23 22/25/28 2900/3500/4200 130/190/270 70/100/145"],
  ["Cleaner", ["janitor", "housekeeper"], "52/57/63 49/52/56 34/37/43 29/30/33 22/23/25 17/18/21 19/21/24 2400/2900/3400 100/150/210 68/78/100"],
  ["Security guard", ["security officer"], "55/62/72 50/54/60 35/39/46 29/32/37 22/24/27 17/20/23 20/23/26 2800/3400/4000 130/180/250 68/90/125"],
  ["Construction labourer", ["labourer", "laborer", "construction worker", "builder's labourer"], "58/68/80 52/58/66 40/48/58 30/35/41 22/25/29 18/21/25 22/25/29 3200/3900/4700 110/160/240 68/90/135"],
  ["Mechanic", ["motor mechanic", "car mechanic", "automotive technician"], "65/78/92 58/70/82 48/60/74 34/40/47 24/28/33 19/23/28 23/27/32 3400/4200/5100 160/250/380 140/220/320"],
  ["Hairdresser", ["hair stylist", "barber"], "55/62/72 50/55/63 34/38/46 29/30/34 22/23/26 17/18/21 19/21/24 2600/3100/3800 120/200/320 68/105/165"],
  ["Childcare worker", ["early childhood educator", "early childhood teacher", "nursery worker", "daycare worker"], "56/63/72 50/56/65 36/42/50 36/42/48 22/24/28 17/20/23 20/23/26 3000/3600/4200 100/160/250 68/85/125"],
  ["Care worker", ["aged care worker", "carer", "caregiver", "support worker", "healthcare assistant"], "56/63/72 52/58/64 36/42/49 30/36/42 22/24/27 17/19/22 19/22/25 3000/3600/4200 110/160/230 68/85/125"],
  ["Graphic designer", ["designer"], "62/75/90 55/68/82 45/55/68 34/41/50 27/32/39 20/25/31 22/27/33 3200/4000/5000 240/400/650 160/260/380"],
  ["Marketing manager", [], "100/125/155 90/110/135 72/92/118 58/72/90 45/56/72 35/45/60 38/50/65 5500/7000/9000 800/1400/2400 420/620/880"],
  ["Project manager", [], "110/135/165 95/120/145 78/98/122 58/72/88 42/52/65 34/43/55 38/48/60 5500/7000/8800 900/1500/2400 450/680/950"],
  ["Data analyst", ["analyst"], "82/100/120 72/90/110 62/76/94 48/58/70 36/44/54 26/33/42 28/35/44 4200/5300/6800 400/650/1100 300/450/650"],
  ["Civil engineer", [], "85/105/130 78/98/122 70/88/110 50/60/72 36/44/55 28/35/45 30/37/46 4500/5800/7200 350/600/1000 380/560/800"],
  ["Pharmacist", [], "85/100/118 85/100/118 95/110/125 50/58/68 38/46/58 30/37/45 30/36/43 4800/5600/6500 220/350/550 480/620/780"],
];

const key = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type BuiltinJob = { title: string; aliases: string[] };

/** The jobs with a built-in estimate, for suggesting as someone types. */
export const BUILTIN_JOBS: BuiltinJob[] = ROWS.map(([title, aliases]) => ({ title, aliases }));

export function hasBuiltin(iso: string): boolean {
  return (BUILTIN_COUNTRIES as readonly string[]).includes(iso.toUpperCase());
}

/** The built-in estimate for a job in a country, matched on the job's name or one of its everyday names. */
export function builtinEstimate(iso: string, jobText: string): Estimate | null {
  const column = (BUILTIN_COUNTRIES as readonly string[]).indexOf(iso.toUpperCase());
  if (column < 0) return null;
  const wanted = key(jobText);
  // Accept a plural too ("nurses", "baristas").
  const singular = wanted.replace(/s$/, "");
  const row = ROWS.find(([title, aliases]) => [title, ...aliases].some((name) => key(name) === wanted || key(name) === singular));
  if (!row) return null;
  const [low, typical, high] = row[2].split(" ")[column].split("/").map((value) => Number(value) * 1000);
  const country = BUILTIN_COUNTRIES[column];
  return {
    title: row[0],
    low,
    typical,
    high,
    currency: CURRENCY[country],
    confidence: STEADIER.has(country) ? "medium" : "low",
    basis: `Written by AI from general knowledge in ${GENERATED}, and not checked against live sources since.`,
    sources: [],
    method: "general-knowledge",
  };
}
