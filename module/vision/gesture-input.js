import { FilesetResolver, GestureRecognizer } from './vision_bundle.js';

const vision = await FilesetResolver.forVisionTasks(new URL('./wasm', import.meta.url).href);
const recognizer = await GestureRecognizer.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: new URL('./gesture_recognizer.task', import.meta.url).href,
    delegate: 'CPU'
  },
  runningMode: 'VIDEO',
  numHands: 1
});

export function createGestureInput(getVideo, onGesture, onObservation) {
  let active = false;
  let frameId = 0;
  let lastFrameAt = 0;
  let candidate = '';
  let candidateSince = 0;
  let latched = false;
  let neutralSince = 0;
  let lastReportAt = 0;
  let lastTriggerAt = 0;

  function frame(now) {
    if (!active) return;
    const video = getVideo();
    if (video && video.readyState >= 2 && now - lastFrameAt >= 100) {
      lastFrameAt = now;
      try {
        const result = recognizer.recognizeForVideo(video, now);
        const top = result.gestures[0]?.[0];
        const gesture = top && top.score >= 0.55 && top.categoryName !== 'None' ? top.categoryName : '';
        if (now - lastReportAt >= 500) {
          lastReportAt = now;
          onObservation({ hands: result.landmarks.length, gesture, score: top?.score || 0 });
        }
        if (!gesture) {
          candidate = '';
          if (!neutralSince) neutralSince = now;
          if (now - neutralSince >= 350) latched = false;
        } else {
          neutralSince = 0;
          if (gesture !== candidate) {
            candidate = gesture;
            candidateSince = now;
          } else if (!latched && now - candidateSince >= 600) {
            latched = true;
            lastTriggerAt = now;
            onGesture(gesture);
          } else if (latched && (gesture === 'Pointing_Up' || gesture === 'Victory') && now - lastTriggerAt >= 700) {
            lastTriggerAt = now;
            onGesture(gesture);
          }
        }
      } catch (error) {
        active = false;
        onGesture('', error);
        return;
      }
    }
    frameId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (active) return;
      active = true;
      candidate = '';
      latched = false;
      frameId = requestAnimationFrame(frame);
    },
    stop() {
      active = false;
      cancelAnimationFrame(frameId);
    }
  };
}
