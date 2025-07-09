import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  ScrollView,
  ScrollViewProps,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import React, {FC, useCallback} from 'react';
import {useKeyboardScrollView} from '@hooks/useKeyboardScrollView';

interface iKeyboardScrollView {
  children: React.ReactNode;
  keyboardViewProps?: Omit<KeyboardAvoidingViewProps, 'style' | 'behavior'>;
  scrollViewProps?: ScrollViewProps;
  autoScrollToFocusedInput?: boolean;
  keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
  keyboardVerticalOffset?: number;
  dismissKeyboardOnScroll?: boolean;
  extraScrollOffset?: number;
}

const KeyboardScrollView: FC<iKeyboardScrollView> = ({
  children,
  keyboardViewProps,
  scrollViewProps,
  autoScrollToFocusedInput = true,
  keyboardBehavior,
  keyboardVerticalOffset = 0,
  dismissKeyboardOnScroll = false,
  extraScrollOffset = 50,
}) => {
  const {scrollRef, getInputProps} = useKeyboardScrollView({
    extraScrollOffset,
    autoScroll: autoScrollToFocusedInput,
  });

  // Memoized keyboard dismiss handler
  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Memoized scroll handler for keyboard dismissal
  const handleScroll = useCallback(
    (event: any) => {
      if (dismissKeyboardOnScroll) {
        Keyboard.dismiss();
      }
      // Call original onScroll if provided
      scrollViewProps?.onScroll?.(event);
    },
    [dismissKeyboardOnScroll, scrollViewProps?.onScroll],
  );

  // Determine keyboard behavior based on platform
  const getBehavior = (): KeyboardAvoidingViewProps['behavior'] => {
    if (keyboardBehavior) return keyboardBehavior;

    switch (Platform.OS) {
      case 'ios':
        return 'padding';
      case 'android':
        return 'height';
      default:
        return undefined;
    }
  };

  // Context value for child components to access input props
  const contextValue = React.useMemo(
    () => ({
      getInputProps: autoScrollToFocusedInput ? getInputProps : () => ({}),
    }),
    [getInputProps, autoScrollToFocusedInput],
  );

  return (
    <KeyboardScrollContext.Provider value={contextValue}>
      <KeyboardAvoidingView
        behavior={getBehavior()}
        style={{flex: 1}}
        keyboardVerticalOffset={keyboardVerticalOffset}
        {...keyboardViewProps}>
        <TouchableWithoutFeedback
          onPress={handleDismissKeyboard}
          accessible={false}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1}}
            {...scrollViewProps}
            onScroll={
              dismissKeyboardOnScroll ? handleScroll : scrollViewProps?.onScroll
            }
            scrollEventThrottle={
              dismissKeyboardOnScroll
                ? 16
                : scrollViewProps?.scrollEventThrottle
            }>
            {children}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </KeyboardScrollContext.Provider>
  );
};

// Context for providing input props to child components
const KeyboardScrollContext = React.createContext<{
  getInputProps: () => object;
}>({
  getInputProps: () => ({}),
});

// Hook to use keyboard scroll input props
export const useKeyboardScrollInput = () => {
  const context = React.useContext(KeyboardScrollContext);
  return context.getInputProps();
};

export default KeyboardScrollView;
