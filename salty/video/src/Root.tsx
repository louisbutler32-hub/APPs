import { Composition, Folder } from "remotion";
import { GapInsideJob, gapInsideJobSchema } from "./GapInsideJob";
import { WhichPaysMore, whichPaysMoreSchema } from "./WhichPaysMore";

/**
 * Vertical clips for TikTok, Reels and Shorts: 1080 by 1920, ten seconds.
 *
 * The figures below are only what the editor shows when you open a template. Real clips are made
 * by `npm run make`, which fills each template from the pay data in salty/data/out, so a clip can
 * never show a number the site does not.
 */
const video = { fps: 30, width: 1080, height: 1920, durationInFrames: 300 } as const;
const UK = { locale: "en-GB", currency: "GBP", source: "Official figures: Office for National Statistics, 2026 (provisional). Full-time, per year, before tax.", site: "your-site.com" };

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Salty">
      <Composition
        id="WhichPaysMore"
        component={WhichPaysMore}
        schema={whichPaysMoreSchema}
        defaultProps={{ a: { name: "Train driver", pay: 74376 }, b: { name: "Solicitor", pay: 57198 }, ...UK }}
        {...video}
      />
      <Composition
        id="GapInsideJob"
        component={GapInsideJob}
        schema={gapInsideJobSchema}
        defaultProps={{ jobPlural: "software developers", low: 33352, high: 114051, ...UK }}
        {...video}
      />
    </Folder>
  );
};
