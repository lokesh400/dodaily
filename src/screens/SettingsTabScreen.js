import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HapticTouchable from '../components/HapticTouchable';

const TouchableOpacity = HapticTouchable;

export default function SettingsTabScreen({
  user,
  displayNameInput,
  setDisplayNameInput,
  saveProfile,
  savingProfile,
  handleLogout,
  loggingOut,
  onVerifyEmail,
  verifyingEmail,
}) {
  const [editMode, setEditMode] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setEmailInput(user.email || '');
  }, [user.email]);

  const profileInitial = useMemo(() => {
    const source = user.displayName || user.username || 'U';
    return source.trim().charAt(0).toUpperCase() || 'U';
  }, [user.displayName, user.username]);

  const startEditing = () => {
    setDisplayNameInput(user.displayName || '');
    setEditMode(true);
  };

  const cancelEditing = () => {
    setDisplayNameInput(user.displayName || '');
    setEditMode(false);
  };

  const submitDisplayName = async () => {
    const didSave = await saveProfile();
    if (didSave) {
      setEditMode(false);
    }
  };

  const submitEmailVerification = async () => {
    const trimmedEmail = emailInput.trim();

    setEmailError('');
    if (!trimmedEmail || !/^[\w-.]+@gmail\.com$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid Gmail address');
      return;
    }

    const didSend = await onVerifyEmail(trimmedEmail);
    if (didSend) {
      setShowEmailModal(false);
    }
  };

  return (
    <View style={screenStyles.domainArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={screenStyles.content}
      >
        <View style={screenStyles.heroCard}>
          <View style={screenStyles.heroTopRow}>
            <View style={screenStyles.avatarWrap}>
              <View style={screenStyles.avatarCircle}>
                <Text style={screenStyles.avatarLetter}>{profileInitial}</Text>
              </View>
            </View>

            <View
              style={[
                screenStyles.verificationBadge,
                user.verified ? screenStyles.verificationBadgeVerified : screenStyles.verificationBadgePending,
              ]}
            >
              <MaterialCommunityIcons
                name={user.verified ? 'shield-check' : 'shield-alert-outline'}
                size={14}
                color={user.verified ? '#0e6a5f' : '#9a5a12'}
              />
              <Text
                style={[
                  screenStyles.verificationBadgeText,
                  user.verified
                    ? screenStyles.verificationBadgeTextVerified
                    : screenStyles.verificationBadgeTextPending,
                ]}
              >
                {user.verified ? 'Verified' : 'Needs Verification'}
              </Text>
            </View>
          </View>

          <Text style={screenStyles.heroEyebrow}>Account Hub</Text>
          <Text style={screenStyles.heroTitle}>{user.displayName || user.username}</Text>
          <Text style={screenStyles.heroSubtitle}>
            Keep your profile tidy, confirm your Gmail, and stay ready to share planners and reminders with friends.
          </Text>

          <View style={screenStyles.heroStatsRow}>
            <View style={screenStyles.heroStatCard}>
              <Text style={screenStyles.heroStatLabel}>Username</Text>
              <Text style={screenStyles.heroStatValue}>@{user.username}</Text>
            </View>
            <View style={screenStyles.heroStatCard}>
              <Text style={screenStyles.heroStatLabel}>Email</Text>
              <Text style={screenStyles.heroStatValue} numberOfLines={1}>
                {user.email || 'Not added'}
              </Text>
            </View>
          </View>
        </View>

        <View style={screenStyles.panel}>
          <View style={screenStyles.panelHeader}>
            <View style={screenStyles.panelIconWrap}>
              <MaterialCommunityIcons name="account-edit-outline" size={18} color="#0d7a76" />
            </View>
            <View style={screenStyles.panelHeaderTextWrap}>
              <Text style={screenStyles.panelTitle}>Profile Details</Text>
              <Text style={screenStyles.panelSubtitle}>Update the name your friends see inside the app.</Text>
            </View>
          </View>

          <View style={screenStyles.infoBlock}>
            <Text style={screenStyles.infoLabel}>Username</Text>
            <View style={screenStyles.infoValuePill}>
              <Text style={screenStyles.infoValuePillText}>@{user.username}</Text>
            </View>
          </View>

          <View style={screenStyles.divider} />

          <View style={screenStyles.infoBlock}>
            <Text style={screenStyles.infoLabel}>Display Name</Text>

            {editMode ? (
              <>
                <TextInput
                  style={screenStyles.input}
                  placeholder="Display Name"
                  placeholderTextColor="#6f7f86"
                  value={displayNameInput}
                  onChangeText={setDisplayNameInput}
                />

                <View style={screenStyles.actionRow}>
                  <TouchableOpacity style={screenStyles.secondaryButton} onPress={cancelEditing}>
                    <Text style={screenStyles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={screenStyles.primaryButton}
                    onPress={submitDisplayName}
                    disabled={savingProfile}
                  >
                    <Text style={screenStyles.primaryButtonText}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={screenStyles.editDisplayRow}>
                <View style={screenStyles.displayValueCard}>
                  <Text style={screenStyles.displayValueText}>{user.displayName || 'No display name set'}</Text>
                </View>
                <TouchableOpacity style={screenStyles.editIconButton} onPress={startEditing}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#0d7a76" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={screenStyles.panel}>
          <View style={screenStyles.panelHeader}>
            <View style={screenStyles.panelIconWrap}>
              <MaterialCommunityIcons name="email-check-outline" size={18} color="#0d7a76" />
            </View>
            <View style={screenStyles.panelHeaderTextWrap}>
              <Text style={screenStyles.panelTitle}>Email Verification</Text>
              <Text style={screenStyles.panelSubtitle}>Use Gmail so account verification stays simple and reliable.</Text>
            </View>
          </View>

          <View
            style={[
              screenStyles.emailStatusCard,
              user.verified ? screenStyles.emailStatusCardVerified : screenStyles.emailStatusCardPending,
            ]}
          >
            <View
              style={[
                screenStyles.emailStatusIconWrap,
                user.verified ? screenStyles.emailStatusIconWrapVerified : screenStyles.emailStatusIconWrapPending,
              ]}
            >
              <MaterialCommunityIcons
                name={user.verified ? 'check-decagram' : 'email-fast-outline'}
                size={18}
                color={user.verified ? '#0e6a5f' : '#9a5a12'}
              />
            </View>

            <View style={screenStyles.emailStatusBody}>
              <Text style={screenStyles.emailStatusTitle}>
                {user.verified ? 'Verification complete' : 'Verification still pending'}
              </Text>
              <Text style={screenStyles.emailStatusText}>
                {user.email
                  ? user.email
                  : 'Add your Gmail address so we can send the verification link.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              screenStyles.primaryButton,
              user.verified && screenStyles.primaryButtonMuted,
            ]}
            onPress={() => setShowEmailModal(true)}
            disabled={verifyingEmail || user.verified}
          >
            <Text style={screenStyles.primaryButtonText}>
              {user.verified ? 'Email Verified' : verifyingEmail ? 'Sending...' : user.email ? 'Resend Verification' : 'Add Gmail'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[screenStyles.panel, screenStyles.dangerPanel]}>
          <View style={screenStyles.panelHeader}>
            <View style={[screenStyles.panelIconWrap, screenStyles.dangerIconWrap]}>
              <MaterialCommunityIcons name="logout-variant" size={18} color="#ba4b30" />
            </View>
            <View style={screenStyles.panelHeaderTextWrap}>
              <Text style={screenStyles.panelTitle}>Danger Zone</Text>
              <Text style={screenStyles.panelSubtitle}>Log out on this device when you are finished.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={screenStyles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
            <Text style={screenStyles.logoutButtonText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={screenStyles.modalOverlay}>
          <View style={screenStyles.modalCard}>
            <View style={screenStyles.modalHeader}>
              <View style={screenStyles.modalIconWrap}>
                <MaterialCommunityIcons name="gmail" size={18} color="#0d7a76" />
              </View>
              <View style={screenStyles.modalHeaderTextWrap}>
                <Text style={screenStyles.modalTitle}>Verify your Gmail</Text>
                <Text style={screenStyles.modalSubtitle}>We will send a verification email to this address.</Text>
              </View>
            </View>

            <TextInput
              style={screenStyles.input}
              placeholder="your@gmail.com"
              placeholderTextColor="#6f7f86"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {emailError ? <Text style={screenStyles.modalErrorText}>{emailError}</Text> : null}

            <View style={screenStyles.actionRow}>
              <TouchableOpacity
                style={screenStyles.secondaryButton}
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={screenStyles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={screenStyles.primaryButton}
                disabled={verifyingEmail}
                onPress={submitEmailVerification}
              >
                <Text style={screenStyles.primaryButtonText}>
                  {verifyingEmail ? 'Sending...' : 'Send Verification'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  domainArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: '#0f6f6b',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0c4d48',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarWrap: {
    padding: 3,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dff6e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0d7a76',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verificationBadgeVerified: {
    backgroundColor: '#dff6e8',
  },
  verificationBadgePending: {
    backgroundColor: '#ffedd3',
  },
  verificationBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  verificationBadgeTextVerified: {
    color: '#0e6a5f',
  },
  verificationBadgeTextPending: {
    color: '#9a5a12',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#17463f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  panelIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e8f8f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  panelHeaderTextWrap: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173238',
  },
  panelSubtitle: {
    color: '#59706d',
    marginTop: 3,
    lineHeight: 18,
    fontSize: 12,
  },
  infoBlock: {
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#4f6664',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  infoValuePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#eff9f6',
    borderWidth: 1,
    borderColor: '#d4ece3',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoValuePillText: {
    color: '#0d7a76',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5f1ee',
    marginVertical: 14,
  },
  editDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayValueCard: {
    flex: 1,
    backgroundColor: '#f6fcfa',
    borderWidth: 1,
    borderColor: '#d4ece3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  displayValueText: {
    color: '#173238',
    fontWeight: '700',
    fontSize: 15,
  },
  editIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#c7dfd7',
    backgroundColor: '#f3fbf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f9fdfb',
    color: '#173238',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d7a76',
    flexDirection: 'row',
    flex: 1,
  },
  primaryButtonMuted: {
    backgroundColor: '#8eb9b4',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryButton: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#f6fcfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2f635c',
    fontWeight: '700',
    fontSize: 14,
  },
  emailStatusCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emailStatusCardVerified: {
    backgroundColor: '#ecfaf1',
    borderWidth: 1,
    borderColor: '#cdebd9',
  },
  emailStatusCardPending: {
    backgroundColor: '#fff8ea',
    borderWidth: 1,
    borderColor: '#f0dec0',
  },
  emailStatusIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emailStatusIconWrapVerified: {
    backgroundColor: '#dff6e8',
  },
  emailStatusIconWrapPending: {
    backgroundColor: '#ffedd3',
  },
  emailStatusBody: {
    flex: 1,
  },
  emailStatusTitle: {
    color: '#173238',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  emailStatusText: {
    color: '#5a6f6c',
    lineHeight: 18,
    fontSize: 12,
  },
  dangerPanel: {
    borderColor: '#f0d7cf',
    backgroundColor: '#fffaf8',
  },
  dangerIconWrap: {
    backgroundColor: '#ffe7e1',
  },
  logoutButton: {
    marginTop: 2,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c94848',
    flexDirection: 'row',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 26, 25, 0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    elevation: 5,
    shadowColor: '#123633',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#e8f8f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#173238',
  },
  modalSubtitle: {
    color: '#59706d',
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  modalErrorText: {
    color: '#ba4b30',
    marginBottom: 10,
    fontWeight: '600',
  },
});
