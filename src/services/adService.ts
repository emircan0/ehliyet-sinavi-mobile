import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, RewardedInterstitialAd, TestIds, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';

const interstitialAdUnitId = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
  default: TestIds.INTERSTITIAL,
});

const rewardedAdUnitId = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID || TestIds.REWARDED,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID || TestIds.REWARDED,
  default: TestIds.REWARDED,
});

const rewardedInterstitialAdUnitId = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_INTERSTITIAL_ID || TestIds.REWARDED_INTERSTITIAL,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_INTERSTITIAL_ID || TestIds.REWARDED_INTERSTITIAL,
  default: TestIds.REWARDED_INTERSTITIAL,
});

class AdService {
  private interstitial: InterstitialAd | null = null;
  private rewarded: RewardedAd | null = null;
  private rewardedInterstitial: RewardedInterstitialAd | null = null;
  
  private appStartedAt = Date.now();
  private lastFullScreenAdShownAt = 0; // Tracks both Interstitial + RewardedInterstitial
  private interstitialShowsThisSession = 0;

  private readonly minSessionAgeBeforeInterstitialMs = 5 * 60 * 1000;
  private readonly minFullScreenAdGapMs = 8 * 60 * 1000; // Min gap between ANY full-screen ad
  private readonly maxInterstitialsPerSession = 5; // +1 to compensate for removed mid-quiz ad

  // Store unsubscribe functions to prevent memory leaks
  private interstitialUnsubscribers: (() => void)[] = [];
  private rewardedUnsubscribers: (() => void)[] = [];
  private rewardedInterstitialUnsubscribers: (() => void)[] = [];

  private clearUnsubscribers(unsubscribers: (() => void)[]) {
    unsubscribers.forEach(unsub => unsub());
    unsubscribers.length = 0;
  }

  public loadInterstitial() {
    this.clearUnsubscribers(this.interstitialUnsubscribers);

    this.interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    const unsubLoaded = this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial Ad loaded.');
    });

    const unsubClosed = this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial Ad closed.');
      this.loadInterstitial(); // Preload next ad
    });

    const unsubError = this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial Ad failed to load: ', error);
    });

    this.interstitialUnsubscribers.push(unsubLoaded, unsubClosed, unsubError);
    this.interstitial.load();
  }

  public showInterstitial(onClosed?: () => void): boolean {
    if (this.interstitial && this.interstitial.loaded) {
      let closeListener: (() => void) | null = null;
      
      const cleanup = () => {
        if (closeListener) { closeListener(); closeListener = null; }
        if (onClosed) onClosed();
      };

      closeListener = this.interstitial.addAdEventListener(AdEventType.CLOSED, cleanup);
      this.interstitialUnsubscribers.push(closeListener);

      this.interstitial.show();
      this.lastFullScreenAdShownAt = Date.now(); // Track all full-screen ads
      this.interstitialShowsThisSession += 1;
      return true;
    }
    console.log('Interstitial ad not loaded yet.');
    this.loadInterstitial();
    return false;
  }

  public showInterstitialAtStudyBreak(isPremium: boolean): boolean {
    if (isPremium) return false;

    const now = Date.now();
    const sessionAge = now - this.appStartedAt;
    const timeSinceLastAd = now - this.lastFullScreenAdShownAt;

    // Don't show in the first 5 minutes of a session (warm-up period)
    if (sessionAge < this.minSessionAgeBeforeInterstitialMs) {
      this.loadInterstitial();
      return false;
    }

    if (this.interstitialShowsThisSession >= this.maxInterstitialsPerSession) {
      return false;
    }

    // Guard against double-ads: if any full-screen ad was shown recently, skip
    if (this.lastFullScreenAdShownAt > 0 && timeSinceLastAd < this.minFullScreenAdGapMs) {
      this.loadInterstitial();
      return false;
    }

    return this.showInterstitial();
  }

  public showInterstitialAfterQuiz(isPremium: boolean): boolean {
    if (isPremium) return false;

    const now = Date.now();
    const timeSinceLastAd = now - this.lastFullScreenAdShownAt;

    if (this.interstitialShowsThisSession >= this.maxInterstitialsPerSession) {
      return false;
    }

    // Guard: if a RewardedInterstitial just showed, don't stack another ad
    if (this.lastFullScreenAdShownAt > 0 && timeSinceLastAd < this.minFullScreenAdGapMs) {
      this.loadInterstitial();
      return false;
    }

    return this.showInterstitial();
  }

  public loadRewarded() {
    this.clearUnsubscribers(this.rewardedUnsubscribers);

    this.rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    const unsubLoaded = this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded Ad loaded.');
    });

    const unsubClosed = this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Rewarded Ad closed.');
      this.loadRewarded(); // Preload next ad
    });

    const unsubError = this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Rewarded Ad failed to load: ', error);
    });

    this.rewardedUnsubscribers.push(unsubLoaded, unsubClosed, unsubError);
    this.rewarded.load();
  }

  public showRewarded(onReward: () => void): boolean {
    if (this.rewarded && this.rewarded.loaded) {
      let rewardListener: (() => void) | null = null;
      let closeListener: (() => void) | null = null;

      const cleanup = () => {
        if (rewardListener) { rewardListener(); rewardListener = null; }
        if (closeListener) { closeListener(); closeListener = null; }
      };

      rewardListener = this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        console.log('User earned reward');
        onReward();
      });
      
      closeListener = this.rewarded.addAdEventListener(AdEventType.CLOSED, cleanup);
      this.rewardedUnsubscribers.push(rewardListener, closeListener);

      this.rewarded.show();
      return true;
    }
    console.log('Rewarded ad not loaded yet.');
    this.loadRewarded();
    return false;
  }

  public loadRewardedInterstitial() {
    this.clearUnsubscribers(this.rewardedInterstitialUnsubscribers);

    this.rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(rewardedInterstitialAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    const unsubLoaded = this.rewardedInterstitial.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded Interstitial Ad loaded.');
    });

    const unsubClosed = this.rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Rewarded Interstitial Ad closed.');
      this.loadRewardedInterstitial();
    });

    const unsubError = this.rewardedInterstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Rewarded Interstitial Ad failed to load: ', error);
    });

    this.rewardedInterstitialUnsubscribers.push(unsubLoaded, unsubClosed, unsubError);
    this.rewardedInterstitial.load();
  }

  public showRewardedInterstitial(onReward: () => void, isPremium?: boolean): boolean {
    if (isPremium) return false;

    if (this.rewardedInterstitial && this.rewardedInterstitial.loaded) {
      let rewardListener: (() => void) | null = null;
      let closeListener: (() => void) | null = null;

      const cleanup = () => {
        if (rewardListener) { rewardListener(); rewardListener = null; }
        if (closeListener) { closeListener(); closeListener = null; }
      };

      rewardListener = this.rewardedInterstitial.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        console.log('User earned reward from Rewarded Interstitial');
        onReward();
      });
      
      closeListener = this.rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, cleanup);
      this.rewardedInterstitialUnsubscribers.push(rewardListener, closeListener);

      this.rewardedInterstitial.show();
      this.lastFullScreenAdShownAt = Date.now(); // Track so Interstitial guard picks it up
      this.interstitialShowsThisSession += 1;
      return true;
    }
    console.log('Rewarded Interstitial ad not loaded yet.');
    this.loadRewardedInterstitial();
    return false;
  }

  public showPostQuizAd(isPremium: boolean, onReward?: () => void): boolean {
    if (isPremium) return false;

    if (this.rewardedInterstitial && this.rewardedInterstitial.loaded) {
      return this.showRewardedInterstitial(onReward || (() => {}), isPremium);
    }

    return this.showInterstitialAfterQuiz(isPremium);
  }
}

export const adService = new AdService();
