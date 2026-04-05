import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from '../components/HapticTouchable';

const TouchableOpacity = HapticTouchable;

export default function LoginScreen({ onLogin, onForgotPassword, loading, error, onGoToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotResponse, setForgotResponse] = useState(null);
  const [sendingReset, setSendingReset] = useState(false);

  const openForgotModal = () => {
    setForgotInput(username.trim());
    setForgotError('');
    setForgotResponse(null);
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError('');
    setForgotResponse(null);
  };

  const submitForgotPassword = async () => {
    const identifier = forgotInput.trim();
    if (!identifier) {
      setForgotError('Enter your username or email');
      return;
    }

    if (!onForgotPassword) {
      setForgotError('Password reset is unavailable right now');
      return;
    }

    setForgotError('');
    setSendingReset(true);
    try {
      const response = await onForgotPassword(identifier);
      setForgotResponse(response || {});
    } catch (forgotRequestError) {
      setForgotError(forgotRequestError?.message || 'Failed to send reset link');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badgeDot} />
        <Text style={styles.eyebrow}>DoDaily</Text>
      </View>

      <Text style={styles.title}>Welcome Back !</Text>

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

      <TouchableOpacity style={styles.forgotPasswordButton} onPress={openForgotModal}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchLinkButton} onPress={onGoToSignup}>
        <Text style={styles.switchLinkText}>No account yet? </Text>
        <Text style={styles.switchLinkAccent}>Create one</Text>
      </TouchableOpacity>

      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={closeForgotModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your username or email. We will send a reset link to your registered email.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Username or email"
              placeholderTextColor="#6f7f86"
              autoCapitalize="none"
              value={forgotInput}
              onChangeText={setForgotInput}
            />

            {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}

            {forgotResponse ? (
              <View style={styles.responseCard}>
                <Text style={styles.responseLabel}>Response JSON</Text>
                <Text style={styles.responseText}>{JSON.stringify(forgotResponse, null, 2)}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={closeForgotModal}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} disabled={sendingReset} onPress={submitForgotPassword}>
                <Text style={styles.primaryButtonLabel}>
                  {sendingReset ? 'Sending...' : forgotResponse ? 'Send Again' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: -2,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotPasswordText: {
    color: '#0d7a76',
    fontWeight: '700',
    fontSize: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 35, 33, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7e9e3',
    padding: 16,
    shadowColor: '#163632',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#173238',
  },
  modalSubtitle: {
    color: '#4f6664',
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 19,
    fontSize: 13,
  },
  responseCard: {
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 14,
    backgroundColor: '#f6fcfa',
    padding: 10,
    marginBottom: 10,
  },
  responseLabel: {
    color: '#2f635c',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
  },
  responseText: {
    color: '#173238',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  modalActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: '#f6fcfa',
  },
  secondaryButtonText: {
    color: '#2f635c',
    fontWeight: '700',
  },
  modalPrimaryButton: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
