import { Tabs } from 'expo-router';
import { TabBar } from '@/components/tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"         options={{ title: 'Home'          }} />
      <Tabs.Screen name="expenses"      options={{ title: 'Expenses'      }} />
      <Tabs.Screen name="groups"        options={{ title: 'Groups'        }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Tabs.Screen name="reports"       options={{ title: 'Reports'       }} />
    </Tabs>
  );
}
