import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 16,
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
        }}
      >
        <Text style={{ fontWeight: '600', flex: 1 }}>{title}</Text>
        <Text>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }}>
          {children}
        </View>
      )}
    </View>
  );
};