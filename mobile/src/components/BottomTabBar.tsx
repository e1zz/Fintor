import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import SageButton from './SageButton';
import HouseIcon from '../../assets/icons/house.svg';
import HouseActiveIcon from '../../assets/icons/house-active.svg';
import FileTextIcon from '../../assets/icons/file-text.svg';
import FileTextActiveIcon from '../../assets/icons/file-text-active.svg';
import ReceiptTextIcon from '../../assets/icons/receipt-text.svg';
import ReceiptTextActiveIcon from '../../assets/icons/receipt-text-active.svg';
import SettingsIcon from '../../assets/icons/settings.svg';
import SettingsActiveIcon from '../../assets/icons/settings-active.svg';

type TabConfig = { label: string; Icon: React.FC<SvgProps>; ActiveIcon: React.FC<SvgProps> };

const TABS: Record<string, TabConfig> = {
  Dashboard: { label: 'Dashboard', Icon: HouseIcon, ActiveIcon: HouseActiveIcon },
  CFDIs: { label: 'CFDIs', Icon: FileTextIcon, ActiveIcon: FileTextActiveIcon },
  Tax: { label: 'Tax', Icon: ReceiptTextIcon, ActiveIcon: ReceiptTextActiveIcon },
  Settings: { label: 'Settings', Icon: SettingsIcon, ActiveIcon: SettingsActiveIcon },
};

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // 72pt bar per design: the iOS home indicator sits inside the 18pt bottom padding.
  // Android system navigation can't be overlapped, so pad by its inset there.
  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 18) : 18;

  return (
    <View
      className="flex-row border-t border-border bg-card px-1 pt-[9px]"
      style={{ paddingBottom }}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        if (route.name === 'Sage') {
          return (
            <View key={route.key} className="h-11 flex-1">
              <View className="absolute -top-7.5 left-0 right-0 items-center">
                <SageButton active={focused} onPress={onPress} />
              </View>
            </View>
          );
        }

        const { label, Icon, ActiveIcon } = TABS[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            className="h-11 flex-1 items-center justify-center gap-1"
          >
            {focused ? <ActiveIcon /> : <Icon />}
            <Text
              className={
                focused ? 'font-sans-semibold text-2xs text-primary' : 'font-sans text-2xs text-muted'
              }
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
