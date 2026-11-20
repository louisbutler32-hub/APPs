# Salty video generator

Turns the pay data into finished short videos: vertical, 1080 by 1920, ten seconds, in Salty's fonts and colours. One command makes a batch, and each clip comes with a caption to post with it.

The figures are never typed in by hand. Each clip names a job by its official title and the generator reads the pay from `salty/data/out`, the same files the site reads, so a video and the page it sends people to always agree.

## Make the clips

```
npm install
npm run make
```

Clips land in `out/` as `.mp4`, each with a `.txt` caption beside it. A full batch (26 clips) takes a few minutes.

```
npm run make -- --list             # show what would be made, with the figures, and render nothing
npm run make -- --country uk       # one country
npm run make -- --only plumber     # only clips whose file name contains "plumber"
```

Before posting anything, set your web address: change `"site"` in `content/videos.json`. It appears on the closing card of every clip and in every caption.

## The two formats

| Format | What it shows | Figures used |
|---|---|---|
| **Which pays more?** | Two jobs, a 3-2-1 countdown, then both pay figures and the gap between them | The pay in the middle for each job |
| **The gap inside one job** | "Two nurses. Same job title." then what the lowest and highest paid tenth earn | The published figures for the lowest and highest paid tenth |

Both end on the same card: the wordmark, "Are you underpaid?", your address and the source of the figures.

## Add a clip

Add a line to `content/videos.json`. `title` must match the job's title in `salty/data/out/<country>.json` exactly; `name` (or `plural`) is the short everyday wording shown on screen.

```json
{ "a": { "title": "Train and tram drivers", "name": "Train driver" }, "b": { "title": "Solicitors and lawyers", "name": "Solicitor" } }
```

Run `npm run make -- --list` to check it. A title that is not in the data stops the run with a message naming it. A job with no published figure for the lowest or highest paid tenth cannot be used for a gap clip, and the run says so rather than guessing.

Only the UK and US are available, because they are the only countries with official figures. AI estimates are never used in videos.

## Change the look

```
npm run dev
```

opens Remotion Studio, a live preview where you can scrub through each clip and change the example figures. The templates are `src/WhichPaysMore.tsx` and `src/GapInsideJob.tsx`; colours, fonts and the safe area (the space kept clear of the app's own buttons and caption) are in `src/brand.ts`; the logo and closing card are in `src/parts.tsx`.

## Things to know

- **The clips are silent.** Add a trending sound in the app when you post: sound picked there gets more reach than sound baked into the file.
- **Remotion's licence.** Remotion is free for individuals and companies of up to three people. A larger company needs a paid licence: see remotion.pro.
- **Rendered clips are not committed.** `out/` is ignored by git. Remake them any time.
- **After a data refresh, remake the clips**, so no video quotes last year's figure.
