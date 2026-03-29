import React from "react";
import { Button, Text, View } from "react-native";
import { Professional } from "./new/types";

interface Props {
  professional: Professional;
  onCall: (p: Professional) => void;
  onMessage: (p: Professional) => void;
}

export const ProfessionalCard: React.FC<Props> = ({
  professional,
  onCall,
  onMessage,
}) => {
  return (
    <View
      style={{
        padding: 16,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
        {professional.name}
      </Text>
      <Text>{professional.specialty}</Text>
      <Text>{professional.location}</Text>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <Button title="Appeler" onPress={() => onCall(professional)} />
        <View style={{ width: 8 }} />
        <Button title="Message" onPress={() => onMessage(professional)} />
      </View>
    </View>
  );
};
