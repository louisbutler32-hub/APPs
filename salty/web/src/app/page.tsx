import { Checker } from "@/components/Checker";
import { HeroTitle } from "@/components/HeroTitle";
import { Coming, Example, Founder, HeroIntro, officialJobCount, PayTable, SiteFooter, SiteHeader, Sources } from "@/components/sections";
import { AVAILABLE } from "@/lib/pay/data";

export default function Home() {
  return (
    <>
      <SiteHeader tone="brine" />
      <main>
        <Checker
          available={AVAILABLE}
          intro={
            <HeroIntro title={<HeroTitle text="Are you underpaid?" />}>
              <p>
                Type your job and your pay. See where you rank against everyone doing the same work, from official figures for{" "}
                {officialJobCount()} jobs.
              </p>
            </HeroIntro>
          }
        />
        <Example />
        <PayTable countries={AVAILABLE} />
        <Coming />
        <Sources />
        <Founder />
      </main>
      <SiteFooter />
    </>
  );
}
