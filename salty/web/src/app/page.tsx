import { Checker } from "@/components/Checker";
import { Grains } from "@/components/Grains";
import { Coming, Founder, HeroIntro, HeroStats, HowItWorks, SiteFooter, SiteHeader, Sources, Sting, Ticker } from "@/components/sections";
import { AVAILABLE } from "@/lib/pay/data";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative">
          <Grains edges className="opacity-30" />
          <div className="relative mx-auto max-w-6xl px-5 pt-3 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
            <Checker
              available={AVAILABLE}
              intro={
                <HeroIntro
                  eyebrow="Official pay data · Free · 10 seconds"
                  title={
                    <>
                      Are you <Sting>underpaid?</Sting>
                    </>
                  }
                >
                  <p>Type your job and your pay. See where you rank against everyone doing the same work.</p>
                  <HeroStats />
                </HeroIntro>
              }
            />
          </div>
        </section>
        <Ticker countries={AVAILABLE} />
        <HowItWorks />
        <Coming />
        <Sources />
        <Founder />
      </main>
      <SiteFooter />
    </>
  );
}
