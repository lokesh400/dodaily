import * as Haptics from 'expo-haptics';

const impactStyles = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
  soft: Haptics.ImpactFeedbackStyle.Soft,
};

export async function triggerTapFeedback(style = 'light') {
  try {
    if (style === 'selection') {
      await Haptics.selectionAsync();
      return;
    }

    await Haptics.impactAsync(impactStyles[style] || Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics should never block the main interaction.
  }
}

export async function triggerSuccessFeedback() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Ignore haptic failures and keep the flow moving.
  }
}

export async function triggerErrorFeedback() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Ignore haptic failures and keep the flow moving.
  }
}
