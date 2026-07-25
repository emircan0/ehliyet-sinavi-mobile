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
      
      const cleanup = () => {
        if (closeListener) { closeListener(); closeListener = null; }
        if (onClosed) onClosed();
      };

      closeListener = this.interstitial.addAdEventListener(AdEventType.CLOSED, cleanup);
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

      this.rewarded.show();
      return true;
    }
    console.log('Rewarded ad not loaded yet.');
    this.loadRewarded();
    return false;
  }

  public loadRewardedInterstitial() {
    this.rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(rewardedInterstitialAdUnitId, {
      keywords: ['education', 'driving', 'test', 'exam'],
    });

    this.rewardedInterstitial.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded Interstitial Ad loaded.');
    });

    this.rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Rewarded Interstitial Ad closed.');
      this.loadRewardedInterstitial();
    });

    this.rewardedInterstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Rewarded Interstitial Ad failed to load: ', error);
    });

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

      this.rewardedInterstitial.show();
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
