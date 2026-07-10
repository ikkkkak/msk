# Flux vidéo court — guide d’implémentation (Meskeny)

Ce document résume la stratégie TikTok/Instagram Reels et indique **où c’est déjà codé** dans ce dépôt.

## Résumé exécutif

| Pilier | Implémentation |
|--------|----------------|
| ABR HLS multi-débit | `apartmentscloneserver/services/videoprocessing` — échelle 360p→720p (1080p optionnel) |
| Segments courts | `-hls_init_time 2`, `-hls_time 4`, GOP 48 |
| CDN | GCS/S3 via `storage.UploadLocalFile` |
| Cache manifeste / segments | `storage/media_cache.go` — m3u8 `max-age=5`, segments `immutable` 1 an |
| Lecteur mobile | `expo-av` dans `VideoCard.tsx` (HLS via AVPlayer / ExoPlayer) |
| Préchargement segment 1–2 | `services/videoSegmentPrefetch.ts` + effet dans `VideoFeedScreen` |
| Placeholder flou → net | Poster `preview_blur_url` (FFmpeg) + `BlurView` + fondu `VideoCard` |
| Un seul lecteur actif | `onViewableItemsChanged` + `videoPreloadManager` |
| Annulation scroll rapide | `cancelSegmentPrefetch` si saut >1 en <400 ms |
| Réseau cellulaire | `useConnectivity` + `resolveStreamUri` → `mobile_video_url` |
| Métriques QoE (dev) | `services/videoPlaybackMetrics.ts` |

Architecture détaillée (EN) : [VIDEO_STREAMING_ARCHITECTURE.md](./VIDEO_STREAMING_ARCHITECTURE.md).

## Pipeline serveur (Go + FFmpeg)

1. Upload chunké → `POST /video`
2. File Redis `video:transcode:queue:v1` → workers `videoprocessing`
3. Sorties :
   - `hls_url` (master `.m3u8`)
   - `mobile_video_url` (MP4 ~540p pour cellulaire)
   - `sprite_sheet_url` (scrubbing)
   - **`preview_blur_url`** (JPEG flou 320px, `boxblur`) — migration `019_video_preview_blur.sql`

## Client (Expo)

### Préchargement HLS

- Résout **master → variante** puis télécharge segment(s) `.ts`
- Wi‑Fi / bon réseau : segments **1 + 2** ; sinon segment **1** seulement
- Annulation : `AbortController` sur fetch

### UX feed

- **Poster** : priorité `preview_blur_url` puis thumbnail
- **BlurView** pendant le buffer, fondu ~280 ms vers la vidéo
- **Décodage** : fenêtre glissante via `Videopreloadmanager` (pas de MP4 complet en cache si `FEED_STREAMING_ONLY`)

### Prochaines étapes possibles

- Migrer vers **expo-video** + `useVideoPlayer` + `bufferOptions` (SDK récent)
- **fMP4** (`.m4s`) + LL-HLS si latence <2 s requise
- Brancher `videoPlaybackMetrics` vers Firebase / Prometheus
- URLs signées CDN pour UGC premium

## Checklist ops

1. FFmpeg + Redis sur les workers
2. Migrations `017`, `018`, `019`
3. CORS CDN : `.m3u8`, `.ts`
4. Vérifier headers `Cache-Control` sur GCS/S3 après déploiement
5. Upload test → `hlsURL` + `preview_blur_url` dans le feed
6. Scroll feed : segment 1–2 en réseau, annulation si swipe rapide
