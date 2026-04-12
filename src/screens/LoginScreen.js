import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Animated, Dimensions, Platform, ActivityIndicator, 
  StatusBar, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = Platform.OS === 'web' ? 850 : width * 0.95;
const CARD_HEIGHT = Platform.OS === 'web' ? 550 : height * 0.8;

// --- Neuromorphic Components ---

const NeuInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, onSubmitEditing, returnKeyType }) => {
  return (
    <View style={styles.inputOuter}>
      <View style={styles.inputInner}>
        <TextInput
          style={styles.textInput}
          placeholder={label}
          placeholderTextColor="#A0A0A0"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType || "next"}
        />
      </View>
    </View>
  );
};

const NeuButton = ({ title, onPress, style, textStyle }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={[styles.btnOutset, style]}
    >
      <Text style={[styles.btnText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const SocialIcon = ({ label, color }) => (
  <TouchableOpacity 
    style={styles.socialBtnWide}
    onPress={() => alert(`${label} login feature coming soon!`)}
  >
    <Text style={[styles.socialText, { color: color || '#333' }]}>{label}</Text>
  </TouchableOpacity>
);

export default function LoginScreen({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const shiftAnim = useRef(new Animated.Value(0)).current;

  // Auto-login or auto-fill logic
  useEffect(() => {
    const checkRememberedUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('rememberedUser');
        if (saved) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
          // Optional: Auto-login if you want
          // handleAuth(savedEmail, savedPassword); 
        }
      } catch (e) { console.error('Error loading remembered user', e); }
    };
    checkRememberedUser();
  }, []);

  const toggleMode = () => {
    setError('');
    const toValue = isSignUp ? 0 : 1;
    Animated.timing(shiftAnim, {
      toValue,
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    setIsSignUp(!isSignUp);
  };

  const overlayTranslateX = shiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_WIDTH / 2, 0],
  });

  const innerTranslateX = shiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -CARD_WIDTH / 2],
  });

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email first!');
      return;
    }
    setLoading(true);
    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const user = users.find(u => u.email === email);
      
      if (user) {
        alert(`A password reset link has been sent to ${email} (Demo: Password is ${user.password})`);
      } else {
        setError('Email not found in our records');
      }
    } catch (e) {
      setError('Check your connection');
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    if (isSignUp && !name.trim()) { setError('Name is required!'); return; }
    if (!email.trim()) { setError('Email is required!'); return; }
    if (!password.trim()) { setError('Password is required!'); return; }

    setError('');
    setLoading(true);

    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      if (isSignUp) {
        if (users.find(u => u.email === email)) {
          setError('Email already exists!');
          setLoading(false);
          return;
        }
        const newUser = { name, email, password };
        users.push(newUser);
        await AsyncStorage.setItem('users', JSON.stringify(users));
        
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
        } else {
          await AsyncStorage.removeItem('rememberedUser');
        }
        
        await AsyncStorage.setItem('currUser', JSON.stringify(newUser));
        onLogin(newUser);
      } else {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }
        
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
        } else {
          await AsyncStorage.removeItem('rememberedUser');
        }
        
        await AsyncStorage.setItem('currUser', JSON.stringify(user));
        onLogin(user);
      }
    } catch (e) {
      setError('Connection failed');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.mainCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          
          <View style={styles.panelsContainer}>
            {/* Sign In (Left) */}
            <View style={styles.panel}>
              <Text style={styles.header}>Sign in</Text>
              <View style={styles.socialRow}>
                <SocialIcon label="Google" color="#DB4437" />
                <SocialIcon label="Facebook" color="#4267B2" />
                <SocialIcon label="Linkedin" color="#0077B5" />
              </View>
              <View style={styles.form}>
                <NeuInput 
                  label="Email" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                />
                <NeuInput 
                  label="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  returnKeyType="done"
                  onSubmitEditing={handleAuth}
                />
                
                <View style={styles.rememberRow}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer} 
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <NeuButton title={loading ? "..." : "SIGN IN"} onPress={handleAuth} style={styles.mainBtn} />
              </View>
            </View>

            {/* Sign Up (Right) */}
            <View style={styles.panel}>
              <Text style={styles.header}>Create Account</Text>
              <View style={styles.socialRow}>
                <SocialIcon label="Google" color="#DB4437" />
                <SocialIcon label="Facebook" color="#4267B2" />
                <SocialIcon label="Linkedin" color="#0077B5" />
              </View>
              <View style={styles.form}>
                <NeuInput label="Name" value={name} onChangeText={setName} />
                <NeuInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <NeuInput 
                  label="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  returnKeyType="done"
                  onSubmitEditing={handleAuth}
                />
                <NeuButton title={loading ? "..." : "SIGN UP"} onPress={handleAuth} style={styles.mainBtn} />
              </View>
            </View>
          </View>

          {/* Sliding Overlay */}
          <Animated.View style={[styles.overlayContainer, { width: CARD_WIDTH / 2, transform: [{ translateX: overlayTranslateX }] }]}>
            <View style={styles.hiddenOverflow}>
              <Animated.View style={[styles.innerContentMover, { width: CARD_WIDTH, transform: [{ translateX: innerTranslateX }] }]}>
                
                {/* Overlay Side 1 (Go to Sign Up) */}
                <LinearGradient colors={['#00f2fe', '#4facfe']} style={[styles.gradient, { width: CARD_WIDTH / 2 }]}>
                  <View style={styles.overlayContent}>
                    <Text style={styles.overlayTitle}>Hello, Friend!</Text>
                    <Text style={styles.overlaySubtitle}>Enter your personal details and start journey with us</Text>
                    <TouchableOpacity style={styles.ghostBtn} onPress={toggleMode}>
                      <Text style={styles.ghostBtnText}>SIGN UP</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                {/* Overlay Side 2 (Go to Sign In) */}
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={[styles.gradient, { width: CARD_WIDTH / 2 }]}>
                  <View style={styles.overlayContent}>
                    <Text style={styles.overlayTitle}>Welcome Back!</Text>
                    <Text style={styles.overlaySubtitle}>To keep connected with us please login with your personal info</Text>
                    <TouchableOpacity style={styles.ghostBtn} onPress={toggleMode}>
                      <Text style={styles.ghostBtnText}>SIGN IN</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

              </Animated.View>
            </View>
          </Animated.View>

          {error ? <Text style={styles.floatingError}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff' }
    }),
  },
  panelsContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  panel: {
    width: '50%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  socialBtnWide: {
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    ...Platform.select({
      web: { boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8)' },
      default: { borderWidth: 1, borderColor: '#E0E0E0' }
    })
  },
  socialText: { fontSize: 13, fontWeight: 'bold' },
  form: { width: '100%', alignItems: 'center' },
  inputOuter: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.6)' },
      default: { borderWidth: 1, borderColor: '#E6E6E6' }
    })
  },
  inputInner: { flex: 1, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 15 },
  textInput: { fontSize: 14, color: '#333' },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)' },
      default: { borderWidth: 1, borderColor: '#DDD' }
    })
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF22',
    borderColor: '#6C63FF',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#6C63FF',
  },
  rememberText: { fontSize: 12, color: '#666' },
  forgotText: { fontSize: 12, color: '#999' },
  btnOutset: {
    width: 150,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.1), -5px -5px 10px rgba(255, 255, 255, 0.8)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 4 }
    })
  },
  mainBtn: { marginTop: 10 },
  btnText: { fontWeight: 'bold', color: '#333', letterSpacing: 1 },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 10,
  },
  hiddenOverflow: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  innerContentMover: {
    height: '100%',
    flexDirection: 'row',
  },
  gradient: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayContent: { alignItems: 'center', justifyContent: 'center' },
  overlayTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 15, textAlign: 'center' },
  overlaySubtitle: { fontSize: 13, color: '#FFF', textAlign: 'center', marginBottom: 25, lineHeight: 18 },
  ghostBtn: {
    width: 140,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ghostBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  floatingError: { position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', color: '#ff4d4d', fontSize: 12, zIndex: 20 },
});




