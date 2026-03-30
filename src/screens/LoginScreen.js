import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from '../components/HapticTouchable';

const TouchableOpacity = HapticTouchable;

export default function LoginScreen({ onLogin, loading, error, onGoToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badgeDot} />
        <Text style={styles.eyebrow}>DoDaily</Text>
      </View>

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        Sign in to continue planning your day, sharing with friends, and keeping reminders on track.
      </Text>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor="#6f7f86"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            placeholder="Enter password"
            placeholderTextColor="#6f7f86"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((previous) => !previous)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#2c6e63"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={() => onLogin({ username, password })}>
        <Text style={styles.primaryButtonLabel}>{loading ? 'Signing In...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchLinkButton} onPress={onGoToSignup}>
        <Text style={styles.switchLinkText}>No account yet? </Text>
        <Text style={styles.switchLinkAccent}>Create one</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: '#dceee8',
    shadowColor: '#15443f',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1fa88d',
    marginRight: 8,
  },
  eyebrow: {
    color: '#23776c',
    fontWeight: '800',
    letterSpacing: 1.1,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
    color: '#173238',
  },
  subtitle: {
    fontSize: 15,
    color: '#4e6664',
    marginBottom: 20,
    lineHeight: 22,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#295a53',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfe3dc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f9fdfb',
    color: '#173238',
    fontSize: 15,
  },
  passwordWrap: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  primaryButton: {
    backgroundColor: '#0d7a76',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  switchLinkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5e7e1',
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: '#f5fbf9',
  },
  switchLinkText: {
    color: '#4e6664',
    fontWeight: '600',
    fontSize: 14,
  },
  switchLinkAccent: {
    color: '#0d7a76',
    fontWeight: '800',
    fontSize: 14,
  },
  errorText: {
    color: '#9a1f1f',
    marginBottom: 10,
    fontWeight: '600',
  },
});
