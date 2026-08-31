import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email.trim(), password);
      if (res.success) {
        navigation.navigate('Main');
      } else {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    } catch (e) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Welcome Back" showBack navigation={navigation} />
      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Sign In to Elevance</Text>
        <Text style={[styles.subheading, { color: theme.colors.subtext }]}>
          Access your cart, wishlist, orders & personalized recommendations.
        </Text>

        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Email Address</Text>
          <TextInput
            placeholder="e.g. alex@example.com"
            placeholderTextColor={theme.colors.subtext}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={email}
            onChangeText={(txt) => { setEmail(txt); setErrorMessage(''); }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={theme.colors.subtext}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={password}
            onChangeText={(txt) => { setPassword(txt); setErrorMessage(''); }}
          />
        </View>

        <TouchableOpacity
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={{ color: theme.colors.subtext }}>Don't have an account? </Text>
          <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>Register Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center', flex: 1 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subheading: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  errorBanner: { padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '700' },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  submitBtn: { height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
