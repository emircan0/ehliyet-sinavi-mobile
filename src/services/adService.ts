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

  public showInterstitial(): boolean {
    if (this.interstitial && this.interstitial.loaded) {
      this.interstitial.show();
      return true;
    }
    console.log('Interstitial ad not loaded yet.');
    this.loadInterstitial();
    return false;
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
