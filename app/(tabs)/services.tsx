import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Professional, UserRole } from "../../components/new/types";
import { ProfessionalCard } from "../../components/ProfessionalCard";

import { mockProfessionals } from "../../components/new/mockData";

export default function Services() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");

  const roleFilters: Array<UserRole | "all"> = [
    "all",
    "veterinaire",
    "ingenieur",
  ];

  const filteredProfessionals = useMemo(() => {
    let filtered = [...mockProfessionals];
    if (selectedRole !== "all") {
      filtered = filtered.filter((prof) => prof.role === selectedRole);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prof) =>
          prof.name.toLowerCase().includes(query) ||
          prof.specialty?.toLowerCase().includes(query) ||
          prof.location?.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [searchQuery, selectedRole]);

  const handleCall = (professional: Professional) => {
    if (professional.phone) {
      Alert.alert(`Appeler ${professional.name}`, `${professional.phone}`, [
        { text: "Annuler", style: "cancel" },
        {
          text: "📞 Appeler",
          onPress: () => Linking.openURL(`tel:${professional.phone}`),
        },
      ]);
    }
  };

  const handleMessage = (professional: Professional) => {
    Alert.alert(
      `Messagerie avec ${professional.name}`,
      "Fonctionnalité à venir",
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#16a34a",
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          {/* Ligne avec flèche + titre */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 26,
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              Services
            </Text>
          </View>

          {/* Subtitle bien aligné */}
          <Text
            style={{
              fontSize: 13,
              color: "#dcfce7",
              marginLeft: 36,
              marginTop: 4,
            }}
          >
            Trouvez un professionnel agricole
          </Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Recherche */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ marginRight: 8 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un professionnel..."
              placeholderTextColor="#d1d5db"
              style={{ flex: 1, fontSize: 15, color: "#111827" }}
            />
          </View>

          {/* Filtres */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {roleFilters.map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selectedRole === role ? "#16a34a" : "#fff",
                  borderWidth: 1,
                  borderColor: selectedRole === role ? "#16a34a" : "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    color: selectedRole === role ? "#fff" : "#6b7280",
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {role === "all"
                    ? "Tous"
                    : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Résultats */}
          <Text style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>
            {filteredProfessionals.length} professionnel
            {filteredProfessionals.length > 1 ? "s" : ""} trouvé
            {filteredProfessionals.length > 1 ? "s" : ""}
          </Text>

          {/* Liste */}
          {filteredProfessionals.length > 0 ? (
            <View style={{ gap: 12 }}>
              {filteredProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onCall={handleCall}
                  onMessage={handleMessage}
                />
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text
                style={{ color: "#6b7280", fontWeight: "600", marginBottom: 4 }}
              >
                Aucun professionnel trouvé
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                Essayez de modifier vos filtres
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
