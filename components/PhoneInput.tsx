import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onBlur,
  placeholder = "Enter 8 digits starting with 2, 3, or 4",
  label = "Phone Number",
  error,
  disabled = false,
}) => {
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 8 digits for Mauritania
    const limited = cleaned.slice(0, 8);
    
    // Format as XX XX XX XX
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6)}`;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputContainer, error && styles.inputContainerError, disabled && styles.inputContainerDisabled]}>
        {/* Fixed Country Code */}
        <View style={styles.countryCodeContainer}>
          <Text style={styles.flag}>🇲🇷</Text>
          <Text style={styles.countryCode}>+222</Text>
        </View>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          value={value}
          onChangeText={handleTextChange}
          onBlur={onBlur}
          placeholder={placeholder}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!disabled}
          placeholderTextColor="#999"
          maxLength={11} // 8 digits + 3 spaces = 11 characters
        />
      </View>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: '#FF6B6B',
  },
  inputContainerDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    minWidth: 80,
  },
  flag: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
});