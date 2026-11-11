import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Page } from "../../components/Page";
import { Icon, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { passwordHash } from "../../services/passwordHash";
import { authService } from "../../services/auth/authService";
import { syncFullCatalog } from "../../services/catalog/catalogService";

export function RegisterScreen() {
  const { execute } = useApp();
  const a = useAction();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const rawPhone = phone.replace(/\D/g, "");

  // Validación de nombre y apellido (2 a 50 caracteres)
  const isFirstNameValid =
    firstName.trim().length >= 2 && firstName.trim().length <= 50;
  const isLastNameValid =
    lastName.trim().length >= 2 && lastName.trim().length <= 50;

  // Validación de correo estándar estricto
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    cleanEmail,
  );

  // Validación de teléfono: exactamente 10 dígitos iniciando en 0 (formato móvil estándar Ecuador: 09XXXXXXXX)
  const isPhoneValid = /^0\d{9}$/.test(rawPhone);

  // Validaciones de contraseña (entre 8 y 12 caracteres, mayúscula y número)
  const hasMinChars = password.length >= 8;
  const hasMaxChars = password.length <= 12;
  const hasLengthRange = hasMinChars && hasMaxChars;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasLengthRange && hasUppercase && hasNumber;

  const isConfirmationMatch =
    confirmation.length > 0 && confirmation === password;

  const isFormValid =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordValid &&
    isConfirmationMatch &&
    acceptedTerms;

  const create = () =>
    a.asyncRun(async () => {
      if (!isFirstNameValid)
        throw Error("El nombre debe tener entre 2 y 50 caracteres.");
      if (!isLastNameValid)
        throw Error("El apellido debe tener entre 2 y 50 caracteres.");
      if (!isEmailValid)
        throw Error("Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).");
      if (!isPhoneValid)
        throw Error("El número de teléfono debe tener exactamente 10 dígitos e iniciar con 0 (ej. 0991234567).");
      if (!hasLengthRange)
        throw Error("La contraseña debe tener entre 8 y 12 caracteres.");
      if (!isPasswordValid)
        throw Error("La contraseña debe incluir al menos una mayúscula y un número.");
      if (!isConfirmationMatch)
        throw Error("Las contraseñas no coinciden.");
      if (!acceptedTerms)
        throw Error("Debes aceptar los Términos y Condiciones para continuar.");

      const hash = await passwordHash(password);
      const response = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: rawPhone,
        password,
      });

      await syncFullCatalog(response.tokens.accessToken).catch(() => undefined);
      execute((r) => r.authenticateFromApi(response.user, hash));
    });

  return (
    <Page
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={!isFormValid || a.busy}
          onPress={() => void create()}
          style={({ pressed }) => [
            styles.submitButton,
            (!isFormValid || a.busy) && styles.submitButtonDisabled,
            pressed && styles.submitButtonPressed,
          ]}
          testID="register_submit_button"
        >
          <Text style={styles.submitButtonText}>Crear cuenta y continuar</Text>
          <Icon name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      }
    >
      {/* Cabecera de etapas */}
      <View style={styles.stepHeader}>
        <View style={styles.stepLabels}>
          <Text style={styles.stepIndex}>Paso 1 de 3</Text>
          <Text style={styles.stepTitle}>Datos de Cuenta</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressTrack, { width: "33%" }]} />
        </View>
      </View>

      {/* Título y descripción */}
      <View style={styles.titleSection}>
        <Text style={styles.mainHeading}>Crea tu cuenta</Text>
        <Text style={styles.mainDescription}>
          Únete a Laundry Clean & Fresh para programar recogidas eco-amigables y
          lavandería experta hasta tu puerta.
        </Text>
      </View>

      {/* Formulario unificado */}
      <View style={styles.formCard}>
        {/* Nombre */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={18} color="#64748B" />
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ej. María"
              placeholderTextColor="#94A3B8"
              maxLength={50}
              autoComplete="given-name"
              textContentType="givenName"
              style={styles.textInput}
              testID="register_first_name"
            />
          </View>
        </View>

        {/* Apellido */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Apellido</Text>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={18} color="#64748B" />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ej. Torres"
              placeholderTextColor="#94A3B8"
              maxLength={50}
              autoComplete="family-name"
              textContentType="familyName"
              style={styles.textInput}
              testID="register_last_name"
            />
          </View>
        </View>

        {/* Correo electrónico */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={18} color="#64748B" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="maria.torres@email.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.textInput}
              testID="register_email"
            />
          </View>
        </View>

        {/* Teléfono móvil con prefijo de Ecuador */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Teléfono móvil</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBadge}>
              <Text style={styles.countryCodeText}>EC +593</Text>
            </View>
            <View style={[styles.inputContainer, styles.phoneInputContainer]}>
              <Icon name="call-outline" size={18} color="#64748B" />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                placeholder="099 123 4567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                autoComplete="tel"
                style={styles.textInput}
                testID="register_phone"
              />
            </View>
          </View>
        </View>

        {/* Contraseña */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              value={password}
              onChangeText={(v) => setPassword(v.slice(0, 12))}
              placeholder="8 a 12 caracteres"
              placeholderTextColor="#94A3B8"
              maxLength={12}
              secureTextEntry={!showPassword}
              style={styles.textInput}
              testID="register_password"
            />
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Alternar visualización de contraseña"
            >
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </Pressable>
          </View>

          {/* Barra indicadora y requisitos de contraseña */}
          {password.length > 0 && (
            <View style={styles.passwordValidationBox}>
              <View style={styles.strengthRow}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        width: isPasswordValid
                          ? "100%"
                          : hasMinChars && hasMaxChars
                          ? "60%"
                          : "30%",
                        backgroundColor: isPasswordValid
                          ? "#16A34A"
                          : hasMinChars && hasMaxChars
                          ? "#EAB308"
                          : "#DC2626",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    {
                      color: isPasswordValid
                        ? "#16A34A"
                        : hasMinChars && hasMaxChars
                        ? "#CA8A04"
                        : "#DC2626",
                    },
                  ]}
                >
                  {isPasswordValid ? "Segura" : hasMinChars && hasMaxChars ? "Media" : "Débil"}
                </Text>
              </View>

              <View style={styles.requirementsRow}>
                <View style={styles.requirementItem}>
                  <Icon
                    name={
                      hasLengthRange
                        ? "checkmark-circle"
                        : "checkmark-circle-outline"
                    }
                    size={14}
                    color={hasLengthRange ? "#16A34A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasLengthRange && styles.requirementTextActive,
                    ]}
                  >
                    8 a 12 caracteres
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Icon
                    name={
                      hasUppercase
                        ? "checkmark-circle"
                        : "checkmark-circle-outline"
                    }
                    size={14}
                    color={hasUppercase ? "#16A34A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasUppercase && styles.requirementTextActive,
                    ]}
                  >
                    Una mayúscula
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Icon
                    name={
                      hasNumber
                        ? "checkmark-circle"
                        : "checkmark-circle-outline"
                    }
                    size={14}
                    color={hasNumber ? "#16A34A" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasNumber && styles.requirementTextActive,
                    ]}
                  >
                    Un número
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Confirmar contraseña */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              value={confirmation}
              onChangeText={(v) => setConfirmation(v.slice(0, 12))}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#94A3B8"
              maxLength={12}
              secureTextEntry={!showPassword}
              style={styles.textInput}
              testID="register_password_confirmation"
            />
            {isConfirmationMatch ? (
              <Icon name="checkmark-circle" size={18} color="#16A34A" />
            ) : null}
          </View>
        </View>

        {/* Términos y Condiciones */}
        <Pressable
          onPress={() => setAcceptedTerms((v) => !v)}
          style={styles.termsRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
        >
          <View
            style={[
              styles.checkbox,
              acceptedTerms && styles.checkboxChecked,
            ]}
          >
            {acceptedTerms && (
              <Icon name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.termsText}>
            Acepto los{" "}
            <Text style={styles.termsLink}>Términos y Condiciones</Text> y la{" "}
            <Text style={styles.termsLink}>Política de Privacidad</Text> de CFL.
          </Text>
        </Pressable>

        {a.feedback}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    marginBottom: 16,
    gap: 8,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepIndex: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F4C81",
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressTrack: {
    height: "100%",
    backgroundColor: "#A5CD39",
    borderRadius: 2,
  },
  titleSection: {
    marginBottom: 20,
    gap: 6,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F4C81",
    letterSpacing: -0.5,
  },
  mainDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  countryCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F4FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  phoneInputContainer: {
    flex: 1,
  },
  passwordValidationBox: {
    marginTop: 6,
    gap: 8,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  requirementsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requirementText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  requirementTextActive: {
    color: "#16A34A",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#0F4C81",
    borderColor: "#0F4C81",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  termsLink: {
    color: "#0F4C81",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#143F73",
    borderRadius: 14,
    height: 52,
    gap: 8,
    shadowColor: "#143F73",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonPressed: {
    backgroundColor: "#0F315A",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
