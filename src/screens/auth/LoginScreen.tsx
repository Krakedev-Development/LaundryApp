import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface LoginScreenProps {
  onLogin: (role: 'CLIENT' | 'DRIVER') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'CLIENT' | 'DRIVER'>('CLIENT');
  const [email, setEmail] = useState('maria.torres@gmail.com');
  const [password, setPassword] = useState('••••••••');

  const handleRoleToggle = (selected: 'CLIENT' | 'DRIVER') => {
    setRole(selected);
    if (selected === 'CLIENT') {
      setEmail('maria.torres@gmail.com');
    } else {
      setEmail('carlos.mendoza@laundryfresh.com');
    }
  };

  const handleSignIn = () => {
    onLogin(role);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="shirt" size={36} color="#FFF" />
        </View>
        <Text style={styles.title}>Laundry Clean & Fresh</Text>
        <Text style={styles.subtitle}>Cuidado profesional de prendas a domicilio</Text>
      </View>

      {/* Role Switcher */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'CLIENT' && styles.roleBtnActive]}
          onPress={() => handleRoleToggle('CLIENT')}
        >
          <Text style={[styles.roleText, role === 'CLIENT' && styles.roleTextActive]}>
            Cliente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'DRIVER' && styles.roleBtnActive]}
          onPress={() => handleRoleToggle('DRIVER')}
        >
          <Text style={[styles.roleText, role === 'DRIVER' && styles.roleTextActive]}>
            Chofer / Repartidor
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleSignIn}>
          <Text style={styles.loginBtnText}>
            Ingresar como {role === 'CLIENT' ? 'Cliente' : 'Chofer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => Alert.alert('Recuperar Acceso', 'Se ha enviado un correo con instrucciones de restablecimiento.')}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  roleTextActive: {
    color: '#FFF',
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
