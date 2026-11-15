/**
 * The animated page backgrounds: a short looping video and a matching still
 * for each page. To give a page its own artwork, add its two files to
 * assets/backgrounds and a line here.
 */
export type BackgroundPage = 'welcome' | 'home' | 'today' | 'scan' | 'profile';

interface PageArt {
  /** Shown first, under the video, and on its own whenever video shouldn't play. */
  still: number;
  /** Null for a page that only has a still. */
  video: number | null;
}

export const PAGE_ART: Record<BackgroundPage, PageArt> = {
  welcome: { still: require('@/assets/backgrounds/bg-welcome.jpg'), video: require('@/assets/backgrounds/bg-welcome.mp4') },
  home: { still: require('@/assets/backgrounds/bg-home.jpg'), video: require('@/assets/backgrounds/bg-home.mp4') },
  today: { still: require('@/assets/backgrounds/bg-today.jpg'), video: require('@/assets/backgrounds/bg-today.mp4') },
  scan: { still: require('@/assets/backgrounds/bg-scan.jpg'), video: require('@/assets/backgrounds/bg-scan.mp4') },
  // Profile stays calm: the scan still, dimmed, no video. Swap in bg-profile.jpg / .mp4 here when it exists.
  profile: { still: require('@/assets/backgrounds/bg-scan.jpg'), video: null },
};

/** The artwork is drawn 9 wide by 16 tall. */
export const ART_ASPECT = 9 / 16;
