# Media size optimization (mobile-first)

Aggressive compression before CDN storage — same goals as TikTok/Reels/Shorts: smaller files, near-identical perceived quality on phones.

## Pipeline

```mermaid
flowchart LR
  UP[Upload chunk / base64]
  OPT[mediaoptimize FFmpeg]
  CDN[Cloudinary / GCS / S3]
  HLS[videoprocessing HLS]
  UP --> OPT --> CDN
  CDN --> HLS
```

| Stage | Package | What it does |
|-------|---------|----------------|
| Upload | `storage.UploadLocalFileOptimized` | CRF MP4 or WebP before CDN |
| Feed transcode | `videoprocessing` | Mezzanine normalize → portrait HLS ladder (CRF + maxrate caps) |

## Video (H.264 + CRF)

**Upload mezzanine** (`services/mediaoptimize/video.go`):

```bash
ffmpeg -y -i input.mp4 \
  -map 0:v:0? -map 0:a:0? -map_metadata -1 \
  -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease" \
  -c:v libx264 -preset medium -profile:v high -crf 26 \
  -maxrate 5M -bufsize 10M -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 2 -ar 44100 \
  -movflags +faststart -shortest optimized.mp4
```

**HLS variant (per rung)** — CRF with bitrate ceiling:

```bash
ffmpeg -y -i mezzanine.mp4 \
  -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset veryfast -profile:v high -crf 28 \
  -maxrate 1800k -bufsize 2M \
  -c:a aac -b:a 96k -g 48 -hls_time 4 -hls_init_time 2 ...
```

### CRF recommendations (mobile)

| Use case | CRF | Notes |
|----------|-----|--------|
| Upload mezzanine | **26** | Best size/quality for re-encode + HLS |
| HLS 720p rung | **28** | Cap with `maxrate` per ladder |
| Mobile MP4 fallback | **28** | `maxrate 900k`, 540×960 pad |
| Low-end / 360p only | **30** | Smaller; watch for banding in sky |

Lower CRF = higher quality, larger files. Social apps often use **26–28** for UGC after capture.

### Expected ratios (typical phone uploads)

| Source | Often becomes |
|--------|----------------|
| 50 MB 1080p30 phone clip | **8–15 MB** mezzanine @ CRF 26 |
| 10 MB JPEG photo | **0.4–0.9 MB** WebP @ q=82, max edge 2048 |
| Already heavily compressed | May skip (no size win logged) |

## Images (WebP)

```bash
ffmpeg -y -i input.jpg -map_metadata -1 \
  -vf "scale='min(2048,iw)':'min(2048,ih)':force_original_aspect_ratio=decrease" \
  -c:v libwebp -quality 82 -preset picture -compression_level 4 out.webp
```

| Setting | Recommendation |
|---------|----------------|
| Max edge | **2048** listing photos; **720** thumbs |
| WebP quality | **80–85** (82 default) — Instagram-class |
| Fallback | JPEG `-q:v 3` if libwebp missing |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `MEDIA_OPTIMIZE_ENABLED` | `true` | Master switch |
| `MEDIA_VIDEO_CRF` | `26` | Upload normalize |
| `MEDIA_VIDEO_MOBILE_CRF` | `28` | Feed mobile MP4 |
| `MEDIA_VIDEO_PRESET` | `medium` | Upload encode speed |
| `MEDIA_VIDEO_MAX_WIDTH` | `1080` | Portrait box |
| `MEDIA_VIDEO_MAX_HEIGHT` | `1920` | Portrait box |
| `MEDIA_VIDEO_FPS` | `30` | Normalize fps |
| `MEDIA_IMAGE_MAX_EDGE` | `2048` | Photo long edge |
| `MEDIA_IMAGE_WEBP_QUALITY` | `82` | WebP quality |
| `FFMPEG_PATH` | `ffmpeg` | Required |

## Logs

```
📷 mediaoptimize video orig=48.7MB → opt=9.2MB (81.1% smaller, ratio=0.19)
```

## Platform practices (summary)

- **Normalize once** at ingest (fps, resolution cap, metadata strip, faststart).
- **CRF + maxrate** instead of fixed bitrate only — smaller when easy, capped when complex.
- **WebP/AVIF** for photos on CDN; keep JPEG fallback.
- **Never store** camera EXIF on user uploads (privacy + bytes).
- **Async** HLS after smaller mezzanine = faster workers, less egress.
- **Skip** recompress when output would be larger (already optimal).

## Ops

1. FFmpeg with `libx264` + `libwebp` on API/worker hosts.
2. `MEDIA_OPTIMIZE_ENABLED=false` only for debugging.
3. Watch `mediaoptimize` log lines for ratio regressions after preset changes.
