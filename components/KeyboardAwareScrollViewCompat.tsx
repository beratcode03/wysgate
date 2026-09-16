import { Platform, ScrollView, ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  bottomOffset,
  extraKeyboardSpace,
  ...props
}: Props) {
  const insets = useSafeAreaInsets();
  const resolvedBottomOffset = bottomOffset ?? Math.max(insets.bottom, 8);
  const resolvedExtraKeyboardSpace = extraKeyboardSpace ?? 0;
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bottomOffset={resolvedBottomOffset}
      extraKeyboardSpace={resolvedExtraKeyboardSpace}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
