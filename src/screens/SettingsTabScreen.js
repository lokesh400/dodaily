import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

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

  return (
    <View style={screenStyles.domainArea}>
      <View style={screenStyles.settingsCard}>
        <Text style={screenStyles.settingsTitle}>Profile Settings</Text>
        <Text style={screenStyles.settingsLabel}>Username</Text>
        <Text style={screenStyles.settingsValue}>{user.username}</Text>
        <Text style={screenStyles.settingsLabel}>Display Name</Text>
        {editMode ? (
          <>
            <TextInput
              style={screenStyles.input}
              placeholder="Display Name"
              placeholderTextColor="#6f7f86"
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
            />
            <View style={screenStyles.settingsActions}>
              <TouchableOpacity style={screenStyles.settingsCancelButton} onPress={() => { setDisplayNameInput(user.displayName || ''); setEditMode(false); }}>
                <Text style={screenStyles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={screenStyles.settingsSaveButton} onPress={() => { saveProfile(); setEditMode(false); }} disabled={savingProfile}>
                <Text style={screenStyles.settingsSaveText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={screenStyles.settingsValue}>{user.displayName}</Text>
            <TouchableOpacity onPress={() => setEditMode(true)} style={{ marginLeft: 8 }}>
              <MaterialIcons name="edit" size={20} color="#0d7a76" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={screenStyles.verifyEmailButton} onPress={onVerifyEmail} disabled={verifyingEmail || user.verified}>
          <Text style={screenStyles.verifyEmailText}>
            {user.verified ? 'Email Verified' : verifyingEmail ? 'Sending...' : 'Verify Email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={screenStyles.settingsLogoutButton} onPress={handleLogout} disabled={loggingOut}>
          <Text style={screenStyles.settingsLogoutText}>{loggingOut ? 'Logging out...' : 'Logout'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  domainArea: {
    flex: 1,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4ece3',
    padding: 12,
    marginBottom: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173238',
    marginBottom: 10,
  },
  settingsLabel: {
    fontSize: 12,
    color: '#4f6664',
    marginBottom: 2,
    fontWeight: '700',
  },
  settingsValue: {
    fontSize: 13,
    color: '#173238',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f9fdfb',
    color: '#173238',
  },
  settingsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  settingsCancelButton: {
    borderWidth: 1,
    borderColor: '#c7dfd7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: '#f6fcfa',
  },
  settingsCancelText: {
    color: '#2f635c',
    fontWeight: '700',
  },
  settingsSaveButton: {
    backgroundColor: '#0d7a76',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settingsSaveText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  settingsLogoutButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c94848',
  },
  settingsLogoutText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  verifyEmailButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d7a76',
  },
  verifyEmailText: {
    color: '#fff',
    fontWeight: '700',
  },
});
