import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, TestIds, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';

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

class AdService {
  private interstitial: InterstitialAd | null = null;
  private rewarded: RewardedAd | null = null;
  private appStartedAt = Date.now();
  private lastInterstitialShownAt = 0;
  private interstitialShowsThisSession = 0;

  private readonly minSessionAgeBeforeInterstitialMs = 5 * 60 * 1000;
  private readonly minInterstitialGapMs = 8 * 60 * 1000;
  private readonly maxInterstitialsPerSession = 4;

  public loadInterstitial() {
    this.interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial Ad loaded.');
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial Ad closed.');
      this.loadInterstitial(); // Preload next ad
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial Ad failed to load: ', error);
    });

    this.interstitial.load();
  }

  public showInterstitial(onClosed?: () => void): boolean {
    if (this.interstitial && this.interstitial.loaded) {
      let closeListener: (() => void) | null = null;
      if (onClosed) {
        closeListener = this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          closeListener?.();
          onClosed();
        });
      }

      this.interstitial.show();
      this.lastInterstitialShownAt = Date.now();
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
    const timeSinceLastShow = now - this.lastInterstitialShownAt;

    if (sessionAge < this.minSessionAgeBeforeInterstitialMs) {
      this.loadInterstitial();
      return false;
    }

    if (this.interstitialShowsThisSession >= this.maxInterstitialsPerSession) {
      return false;
    }

    if (this.lastInterstitialShownAt > 0 && timeSinceLastShow < this.minInterstitialGapMs) {
      this.loadInterstitial();
      return false;
    }

    return this.showInterstitial();
  }

  public showInterstitialAfterQuiz(isPremium: boolean): boolean {
    if (isPremium) return false;

    const now = Date.now();
    const timeSinceLastShow = now - this.lastInterstitialShownAt;

    if (this.interstitialShowsThisSession >= this.maxInterstitialsPerSession) {
      return false;
    }

    if (this.lastInterstitialShownAt > 0 && timeSinceLastShow < this.minInterstitialGapMs) {
      this.loadInterstitial();
      return false;
    }

    return this.showInterstitial();
  }

  public loadRewarded() {
    this.rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded Ad loaded.');
    });

    this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Rewarded Ad closed.');
      this.loadRewarded(); // Preload next ad
    });

    this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Rewarded Ad failed to load: ', error);
    });

    this.rewarded.load();
  }

  public showRewarded(onReward: () => void): boolean {
    if (this.rewarded && this.rewarded.loaded) {
      const rewardListener = this.rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          console.log('User earned reward');
          onReward();
          rewardListener(); // Unsubscribe
        }
      );
      this.rewarded.show();
      return true;
    }
    console.log('Rewarded ad not loaded yet.');
    this.loadRewarded();
    return false;
  }
}

export const adService = new AdService();
