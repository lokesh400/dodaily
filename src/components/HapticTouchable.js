import { forwardRef } from 'react';
import { TouchableOpacity } from 'react-native';

import { triggerTapFeedback } from '../utils/haptics';

const HapticTouchable = forwardRef(function HapticTouchable(
  { disabled, feedbackStyle = 'light', onPress, ...props },
  ref
) {
  const handlePress = (event) => {
    if (disabled) {
      return;
    }

    void triggerTapFeedback(feedbackStyle);
    onPress?.(event);
  };

  return <TouchableOpacity ref={ref} disabled={disabled} onPress={handlePress} {...props} />;
});

export default HapticTouchable;
