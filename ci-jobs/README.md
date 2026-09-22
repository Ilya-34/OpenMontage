# CI render jobs

Each subfolder here is one renderable job for `.github/workflows/render.yml`.
Only small, text-based config lives in git — no video/audio binaries.

```
ci-jobs/<job_name>/
  props.json      # Remotion input props for the composition (required)
  manifest.json   # optional: {"assets": [{"url": "...", "dest": "..."}]}
```

`manifest.json` lists any media the job's `props.json` references via a
relative (staticFile) path — e.g. the user's own source footage, which stays
local and is never committed (see the project's `.gitignore`:
`remotion-composer/public/*`). Before rendering, the workflow downloads each
`url` into `remotion-composer/public/<dest>`, so relative paths resolve
exactly as they do on a local render.

`url` needs to be fetchable by the runner without auth — a public stock-
footage link (Pexels/Pixabay), or the user's own footage uploaded somewhere
reachable for the run (e.g. a GitHub Release asset on this repo).

## Running a job

```bash
gh workflow run render.yml \
  -f job_name=<job_name> \
  -f composition=TalkingHead \
  -f frames=0-1445 \
  -f concurrency=2
```

Or from the Actions tab on GitHub: **Render Video** -> **Run workflow**, fill
in the same inputs. The rendered MP4 is attached as a workflow artifact
(kept 14 days).
