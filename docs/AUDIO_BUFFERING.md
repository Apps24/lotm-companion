# Narration buffering repair

Sentence-sized requests could exceed the Worker's six-per-minute limit. Narration now groups each paragraph into bounded passages (at most 1,800 characters), prepares the next passage while playing, reuses the audio element and removes artificial inter-passage timers. Device narration also speaks passages directly. This reduces request frequency and network gaps; separate generated clips are not guaranteed sample-gapless.

Stopping or changing chapters aborts pending work. Errors distinguish HTTP/service failures, network failures, invalid audio and browser autoplay restrictions. Worker quota failures return an actionable 429. No rate or paid-plan settings are silently increased.

Validation: `node scripts/test-audio.cjs`, followed by `npm run check`.
