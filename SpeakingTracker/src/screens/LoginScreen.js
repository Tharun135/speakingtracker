import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Animated, Dimensions, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Platform.OS === 'web' ? 768 : width * 0.95;
const OVERLAY_WIDTH = CARD_WIDTH / 2;

export default function LoginScreen({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [accountMap, setAccountMap] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAccountMap();
  }, []);

  const loadAccountMap = async () => {
    try {
      const mapStr = await AsyncStorage.getItem('accountMap');
      if (mapStr) {
        const map = JSON.parse(mapStr);
        setAccountMap(map);
        
        // Also pre-fill the very last user for convenience
        const lastEmail = await AsyncStorage.getItem('savedEmail');
        if (lastEmail && map[lastEmail]) {
          setEmail(lastEmail);
          setPassword(map[lastEmail]);
          setRememberMe(true);
        }
      }
    } catch (e) { console.error('Map Load Error', e); }
  };

  const handleEmailChange = (text) => {
    setError('');
    setEmail(text);
    // Auto-fill password if we remember this email
    if (accountMap[text]) {
      setPassword(accountMap[text]);
      setRememberMe(true);
    }
  };

  const toggleMode = () => {
    setError('');
    setEmail('');
    setPassword('');
    setRepeatPassword('');
    const toValue = isSignUp ? 0 : 1;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 12,
      tension: 50
    }).start();
    setIsSignUp(!isSignUp);
  };

  const handleLogin = async () => {
    // Specific field validation
    if (isSignUp && !name.trim()) { setError('Name is required!'); return; }
    if (!email.trim()) { setError('Email is required!'); return; }
    if (!password.trim()) { setError('Password is required!'); return; }
    if (isSignUp && password !== repeatPassword) { setError('Passwords do not match!'); return; }
    
    setError('');
    setLoading(true);

    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      if (isSignUp) {
        // Check if user already exists
        if (users.find(u => u.email === email)) {
          setError('Email already registered!');
          setLoading(false);
          return;
        }
        // Save new user
        const newUser = { name, email, password };
        users.push(newUser);
        await AsyncStorage.setItem('users', JSON.stringify(users));
        
        await AsyncStorage.setItem('currUser', JSON.stringify(newUser));
        setLoading(false);
        onLogin(newUser);
      } else {
        const user = users.find(u => u.email === email);
        if (!user) {
          setError('User not found!');
          setLoading(false);
          return;
        }
        if (user.password !== password) {
          setError('Incorrect password!');
          setLoading(false);
          return;
        }

        await AsyncStorage.setItem('currUser', JSON.stringify(user));
        
        // Advanced Remember Me: Save to Map
        let newMap = { ...accountMap };
        if (rememberMe) {
          newMap[email] = password;
          await AsyncStorage.setItem('savedEmail', email);
        } else {
          delete newMap[email];
        }
        await AsyncStorage.setItem('accountMap', JSON.stringify(newMap));
        setAccountMap(newMap);

        setLoading(false);
        onLogin(user);
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Overlay Animation
  const overlayTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [OVERLAY_WIDTH, 0]
  });

  const overlayContentTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, OVERLAY_WIDTH]
  });

  const isMobile = width < 768;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.card, isMobile && { width: width * 0.9, height: 'auto', paddingVertical: 20 }]}>
        
        {/* MOBILE VIEW */}
        {isMobile ? (
          <View style={[styles.formContainer, { width: '100%', position: 'relative', height: 'auto' }]}>
            <View style={[styles.form, { padding: 20 }]}>
              <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign in'}</Text>
              <View style={styles.socialRow}>
                <SocialIcon emoji="🌐" label="Google" />
                <SocialIcon emoji="📧" label="Other Email" />
              </View>
              <Text style={styles.label}>{isSignUp ? 'or use your email' : 'or use your account'}</Text>
              
              {isSignUp && <NeuInput placeholder="Name" value={name} onChangeText={(t) => {setError(''); setName(t);}} />}
              <NeuInput placeholder="Email" value={email} onChangeText={handleEmailChange} keyboardType="email-address" />
              <NeuInput placeholder="Password" value={password} onChangeText={(t) => {setError(''); setPassword(t);}} secureTextEntry />
              {isSignUp && <NeuInput placeholder="Repeat Password" value={repeatPassword} onChangeText={(t) => {setError(''); setRepeatPassword(t);}} secureTextEntry />}
              
              {!isSignUp && (
                <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    <Text style={styles.checkIcon}>{rememberMe ? '✓' : ''}</Text>
                  </View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </TouchableOpacity>
              )}

              {!isSignUp && <TouchableOpacity><Text style={styles.forgot}>Forgot your password?</Text></TouchableOpacity>}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isSignUp ? 'SIGN UP' : 'SIGN IN'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 25 }} onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={{ color: '#6C63FF', fontWeight: 'bold' }}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* DESKTOP/WEB VIEW (SLIDER) */
          <>
            <View style={[styles.formContainer, { left: 0 }]}>
               <View style={styles.form}>
                  <Text style={styles.title}>Sign in</Text>
                  <View style={styles.socialRow}>
                    <SocialIcon emoji="🌐" label="Google" />
                    <SocialIcon emoji="📧" label="Other Email" />
                  </View>
                  <Text style={styles.label}>or use your account</Text>
                  <NeuInput placeholder="Email" value={email} onChangeText={handleEmailChange} keyboardType="email-address" onSubmitEditing={handleLogin} />
                  <NeuInput placeholder="Password" value={password} onChangeText={(t) => {setError(''); setPassword(t);}} secureTextEntry onSubmitEditing={handleLogin} />
                  
                  <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      <Text style={styles.checkIcon}>{rememberMe ? '✓' : ''}</Text>
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity><Text style={styles.forgot}>Forgot your password?</Text></TouchableOpacity>
                  
                  {error && !isSignUp && <Text style={styles.errorText}>{error}</Text>}
                  
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SIGN IN</Text>}
                  </TouchableOpacity>
               </View>
            </View>

            <View style={[styles.formContainer, { right: 0 }]}>
               <View style={styles.form}>
                  <Text style={styles.title}>Create Account</Text>
                  <View style={styles.socialRow}>
                    <SocialIcon emoji="🌐" label="Google" />
                    <SocialIcon emoji="📧" label="Other Email" />
                  </View>
                  <Text style={styles.label}>or use your email</Text>
                  <NeuInput placeholder="Name" value={name} onChangeText={(t) => {setError(''); setName(t);}} onSubmitEditing={handleLogin} />
                  <NeuInput placeholder="Email" value={email} onChangeText={(t) => {setError(''); setEmail(t);}} keyboardType="email-address" onSubmitEditing={handleLogin} />
                  <NeuInput placeholder="Password" value={password} onChangeText={(t) => {setError(''); setPassword(t);}} secureTextEntry onSubmitEditing={handleLogin} />
                  <NeuInput placeholder="Repeat Password" value={repeatPassword} onChangeText={(t) => {setError(''); setRepeatPassword(t);}} secureTextEntry onSubmitEditing={handleLogin} />
                  
                  {error && isSignUp && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SIGN UP</Text>}
                  </TouchableOpacity>
               </View>
            </View>

            <Animated.View style={[styles.overlayContainer, { transform: [{ translateX: overlayTranslateX }] }]}>
              <Animated.View style={[styles.overlay, { transform: [{ translateX: overlayContentTranslateX }] }]}>
                  <View style={styles.overlayPanelLeft}>
                     <Text style={styles.overlayTitle}>Welcome Back!</Text>
                     <Text style={styles.overlayText}>To keep connected please login with your personal info</Text>
                     <TouchableOpacity style={styles.ghostBtn} onPress={toggleMode}>
                       <Text style={styles.ghostBtnText}>SIGN IN</Text>
                     </TouchableOpacity>
                  </View>
                  <View style={styles.overlayPanelRight}>
                     <Text style={styles.overlayTitle}>Hello, Friend!</Text>
                     <Text style={styles.overlayText}>Enter your personal details and start journey with us</Text>
                     <TouchableOpacity style={styles.ghostBtn} onPress={toggleMode}>
                       <Text style={styles.ghostBtnText}>SIGN UP</Text>
                     </TouchableOpacity>
                  </View>
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const NeuInput = (props) => (
  <View style={styles.inputShadowInner}>
    <TextInput 
      style={styles.input} 
      placeholderTextColor="#a3b1c6"
      {...props}
    />
  </View>
);

const SocialIcon = ({ emoji, label }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <View>
      {showTooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      )}
      <TouchableOpacity 
        style={styles.socialIcon}
        onPressIn={() => setShowTooltip(true)}
        onPressOut={() => setShowTooltip(false)}
        {...(Platform.OS === 'web' && {
          onPointerOver: () => setShowTooltip(true),
          onPointerOut: () => setShowTooltip(false)
        })}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e5ec', justifyContent: 'center', alignItems: 'center' },
  card: {
    width: CARD_WIDTH,
    height: 500,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#a3b1c6', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 1, shadowRadius: 20 },
      web: { boxShadow: '20px 20px 60px #a3b1c6, -20px -20px 60px #ffffff' }
    })
  },
  formContainer: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1
  },
  form: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '900', color: '#444', marginBottom: 15 },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  socialIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff' } })
  },
  tooltip: {
    position: 'absolute', top: -35, left: -20, width: 80, backgroundColor: '#444', padding: 5, borderRadius: 8, zIndex: 100, alignItems: 'center'
  },
  tooltipText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  label: { color: '#a3b1c6', fontSize: 11, marginBottom: 15 },
  inputShadowInner: {
    width: '100%', marginBottom: 10, borderRadius: 10, backgroundColor: '#fff',
    ...Platform.select({ web: { boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff' } })
  },
  input: { padding: 12, fontSize: 13, color: '#444' },
  errorText: { color: '#FF6584', fontSize: 11, fontWeight: '700', marginBottom: 10, textAlign: 'left', width: '100%', paddingLeft: 5 },
  forgot: { color: '#444', fontSize: 12, marginVertical: 10 },
  
  rememberRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, marginBottom: 10, paddingLeft: 2 },
  checkbox: { width: 18, height: 18, borderRadius: 5, backgroundColor: '#f0f0f0', marginRight: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cad2dc' },
  checkboxChecked: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkIcon: { color: '#fff', fontSize: 11, fontWeight: '900' },
  rememberText: { color: '#a3b1c6', fontSize: 13, fontWeight: '700' },

  primaryBtn: {
    backgroundColor: '#6C63FF', width: '100%', padding: 15, borderRadius: 20, alignItems: 'center', marginTop: 10,
    ...Platform.select({ web: { boxShadow: '4px 4px 10px #a3b1c6, -4px -4px 10px #ffffff' } })
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Overlay Logic
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 100,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  overlay: {
    backgroundColor: '#6C63FF',
    width: '200%',
    height: '100%',
    position: 'relative',
    left: '-100%',
    flexDirection: 'row'
  },
  overlayPanelLeft: {
    width: '50%',
    height: '100%',
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayPanelRight: {
    width: '50%',
    height: '100%',
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 15 },
  overlayText: { color: '#fff', fontSize: 13, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  ghostBtn: {
    borderWidth: 1, borderColor: '#fff', paddingHorizontal: 35, paddingVertical: 12, borderRadius: 20
  },
  ghostBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 }
});
