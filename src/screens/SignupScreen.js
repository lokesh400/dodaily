import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SignupScreen({ onSignup, loading, error, onGoToLogin }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Daily Planner</Text>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up and start managing your day</Text>

      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor="#6f7f86"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#6f7f86"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="Password"
          placeholderTextColor="#6f7f86"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((previous) => !previous)}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#2c6e63"
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.primaryButton}
        disabled={loading}
        onPress={() => onSignup({ displayName, username, password })}
      >
        <Text style={styles.primaryButtonLabel}>{loading ? 'Please wait...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchLinkButton} onPress={onGoToLogin}>
        <Text style={styles.switchLinkText}>Already have an account? </Text>
        <Text style={styles.switchLinkAccent}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d4ece3',
  },
  eyebrow: {
    color: '#23776c',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
    color: '#173238',
  },
  subtitle: {
    fontSize: 15,
    color: '#4e6664',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f9fdfb',
    color: '#173238',
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
    top: 13,
  },
  primaryButton: {
    backgroundColor: '#0d7a76',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  switchLinkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6e2db',
    borderRadius: 999,
    paddingVertical: 10,
    backgroundColor: '#f4fbf8',
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
    marginBottom: 8,
    fontWeight: '600',
  },
});
