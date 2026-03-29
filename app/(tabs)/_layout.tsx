import { Tabs } from "expo-router";
import {
  BarChart2,
  Home,
  ShoppingBag,
  Truck,
  User,
  Wrench,
  Settings,
} from "lucide-react-native";
import { useAuth } from "../../src/authcontext";

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <Home width={24} height={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Marché",
          tabBarIcon: ({ color }) => (
            <ShoppingBag width={24} height={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materiel"
        options={{
          title: "Matériel",
          tabBarIcon: ({ color }) => (
            <Truck width={22} height={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color }) => (
            <Wrench width={24} height={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <BarChart2 width={24} height={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User width={24} height={24} color={color} />
          ),
        }}
      />

      {/* Admin Dashboard Tab - Same style as other tabs */}
      {isAdmin && (
        <Tabs.Screen
          name="admindashboard"
          options={{
            title: "Admin",
            tabBarIcon: ({ color }) => (
              <Settings width={24} height={24} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
