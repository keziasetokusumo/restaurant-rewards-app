import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList, TabParamList } from './types';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import RewardsWalletScreen from '../screens/RewardsWalletScreen';
import PayScreen from '../screens/PayScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import RedeemScreen from '../screens/RedeemScreen';
import WalletPaymentMethodsScreen from '../screens/WalletPaymentMethodsScreen';
import RestaurantPayScreen from '../screens/RestaurantPayScreen';
import GastronomesScreen from '../screens/GastronomesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Partial<Record<keyof TabParamList, keyof typeof Ionicons.glyphMap>> = {
  Home: 'compass-outline',
  Feed: 'people-outline',
  Rewards: 'gift-outline',
  Profile: 'person-outline',
};

const PAY_CIRCLE = 54;

function PayTabButton({ onPress }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={tabStyles.payOuter}
      accessibilityRole="button"
      accessibilityLabel="Pay"
    >
      <View style={tabStyles.payCircle}>
        <Ionicons name="qr-code-outline" size={24} color={colors.white} />
      </View>
      <Text style={tabStyles.payLabel}>Pay</Text>
    </Pressable>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: tabStyles.bar,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icon = ICONS[route.name as keyof TabParamList];
          return icon ? <Ionicons name={icon} size={size} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <Tab.Screen
        name="Pay"
        component={PayScreen}
        options={{
          tabBarButton: (props) => <PayTabButton {...props} />,
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen name="Rewards" component={RewardsWalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: typography.h2 as object,
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantPay" component={RestaurantPayScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Redeem" component={RedeemScreen} options={{ title: 'Redeem' }} />
      <Stack.Screen name="WalletPaymentMethods" component={WalletPaymentMethodsScreen} options={{ title: 'Payment methods' }} />
      <Stack.Screen name="Gastronomes" component={GastronomesScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    height: 68,
    paddingBottom: 8,
    overflow: 'visible',
  },
  payOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  payCircle: {
    width: PAY_CIRCLE,
    height: PAY_CIRCLE,
    borderRadius: PAY_CIRCLE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(PAY_CIRCLE / 2),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  payLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 3,
  },
});
