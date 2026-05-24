import Image from "next/image";

const BUILDING_ME_FLYER =
  "https://btscjmokrgxwohqguplm.supabase.co/storage/v1/object/public/diazites/Building%20Me%20Flyer%20Final.png";

export function HomeFlyerSection() {
  return (
    <section
      className="border-b border-border/60 bg-muted/20 py-16 sm:py-20"
      aria-labelledby="home-flyer-heading"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2
          id="home-flyer-heading"
          className="text-center text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Building Me
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          South Bronx Neighborhood Safety Council · 40th Precinct · Community
          Connections for Youth
        </p>
        <div className="relative mx-auto mt-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
          <div className="relative aspect-[8.5/11] w-full">
            <Image
              src={BUILDING_ME_FLYER}
              alt="Building Me program flyer: 8-week youth program in the Bronx with the South Bronx Neighborhood Safety Council, 40th Precinct, and Community Connections for Youth. Includes schedule, program benefits, session topics, and contact information."
              fill
              className="object-contain object-top"
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
