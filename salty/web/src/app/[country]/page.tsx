import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checker } from "@/components/Checker";
import { HeroTitle } from "@/components/HeroTitle";
import { Coming, Founder, HeroIntro, officialJobCount, PayTable, SiteFooter, SiteHeader, Sources } from "@/components/sections";
import { COUNTRIES, isCountryCode } from "@/lib/countries";
import { AVAILABLE } from "@/lib/pay/data";

export function generateStaticParams() {
  return AVAILABLE.map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps<"/[country]">): Promise<Metadata> {
  const { country: code } = await params;
  if (!isCountryCode(code)) return {};
  const country = COUNTRIES[code];
  return {
    title: `Are you underpaid? Check your pay in ${country.inName}`,
    description: `See where your pay ranks against everyone doing your job in ${country.inName}, using official ${country.publisher} figures. Free, no sign-up.`,
    alternates: { canonical: `/${code}` },
  };
}

export default async function CountryPage({ params }: PageProps<"/[country]">) {
  const { country: code } = await params;
  if (!isCountryCode(code) || !AVAILABLE.includes(code)) notFound();
  const country = COUNTRIES[code];

  return (
    <>
      <SiteHeader tone="brine" />
      <main>
        <Checker
          available={AVAILABLE}
          country={code}
          intro={
            <HeroIntro title={<HeroTitle text="Are you underpaid?" />}>
              <p>
                Type your job and your pay. See where you rank against everyone doing the same work in {country.inName}, from{" "}
                {country.publisher} figures for {officialJobCount([code])} jobs.
              </p>
            </HeroIntro>
          }
        />
        <PayTable countries={[code]} rows={24} />
        <Coming />
        <Sources />
        <Founder />
      </main>
      <SiteFooter />
    </>
  );
}
