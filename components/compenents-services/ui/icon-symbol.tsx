import { Text, StyleProp, TextStyle } from 'react-native';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const IconSymbol = ({ name, size = 24, color, style }: IconSymbolProps) => {
  return <Text style={[{ fontSize: size, color }, style]}>{name}</Text>;
};