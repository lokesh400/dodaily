import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ActionStatusModal({
  visible,
  title = 'Working',
  subtitle = 'Please wait a moment.',
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="progress-clock" size={24} color="#ffffff" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#0d7a76" />
            <Text style={styles.loaderText}>Working on it...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 30, 28, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d9ebe5',
    paddingHorizontal: 22,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#123733',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0d7a76',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173238',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: '#54706d',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loaderRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff8f4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  loaderText: {
    marginLeft: 8,
    color: '#0d625e',
    fontWeight: '700',
    fontSize: 13,
  },
});
