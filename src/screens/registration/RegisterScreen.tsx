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
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { findCustomer } from "../../domain/repository";

export function RegisterScreen() {
  const { state, execute } = useApp();
  const a = useAction();
  const navigation = useLaundryNavigation();
  const customer = findCustomer(state);
  const isAlreadyRegistered = !!state.session && !!customer;

  const initialFirst = customer?.name ? customer.name.split(" ")[0] : "";
  const initialLast = customer?.name ? customer.name.split(" ").slice(1).join(" ") : "";

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(isAlreadyRegistered);

  // Registro de interacción y submit para mostrar validaciones claras
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleBack = () => {
    if (isAlreadyRegistered) {
      execute((r) => r.logout());
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Login");
    }
  };

  const cleanEmail = email.trim().toLowerCase();
  const rawPhone = phone.replace(/\D/g, "");

  // Validación de nombre y apellido (2 a 50 caracteres)
  const isFirstNameValid =
    firstName.trim().length >= 2 && firstName.trim().length <= 50;
  const isLastNameValid =
    lastName.trim().length >= 2 && lastName.trim().length <= 50;

  // Validación de correo estándar estricto (máx 50 caracteres)
  const isEmailValid =
    cleanEmail.length > 0 &&
    cleanEmail.length <= 50 &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail);

  // Validación de teléfono: exactamente 10 dígitos iniciando en 0 (Ecuador: 09XXXXXXXX)
  const isPhoneValid = /^0\d{9}$/.test(rawPhone);

  // Validaciones de contraseña (entre 8 y 12 caracteres, mayúscula y número)
  const hasMinChars = password.length >= 8;
  const hasMaxChars = password.length <= 12;
  const hasLengthRange = hasMinChars && hasMaxChars;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid =
    (hasLengthRange && hasUppercase && hasNumber) ||
    (isAlreadyRegistered && password.length === 0);

  const isConfirmationMatch =
    (confirmation.length > 0 && confirmation === password) ||
    (isAlreadyRegistered && confirmation.length === 0);

  const isFormValid =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordValid &&
    isConfirmationMatch &&
    acceptedTerms;

  // Mensajes de error específicos por campo
  const getFirstNameError = (): string | null => {
    if (!submitted && !touched.firstName) return null;
    if (firstName.trim().length === 0) return "Ingresa tu nombre.";
    if (firstName.trim().length < 2)
      return "El nombre debe tener al menos 2 caracteres.";
    if (firstName.trim().length > 50) return "Máximo 50 caracteres permitidos.";
    return null;
  };

  const getLastNameError = (): string | null => {
    if (!submitted && !touched.lastName) return null;
    if (lastName.trim().length === 0) return "Ingresa tu apellido.";
    if (lastName.trim().length < 2)
      return "El apellido debe tener al menos 2 caracteres.";
    if (lastName.trim().length > 50) return "Máximo 50 caracteres permitidos.";
    return null;
  };

  const getEmailError = (): string | null => {
    if (!submitted && !touched.email) return null;
    if (cleanEmail.length === 0) return "Ingresa tu correo electrónico.";
    if (!isEmailValid)
      return "Ingresa un correo electrónico válido (ej. usuario@gmail.com).";
    if (cleanEmail.length > 50) return "Máximo 50 caracteres permitidos.";
    return null;
  };

  const getPhoneError = (): string | null => {
    if (!submitted && !touched.phone) return null;
    if (rawPhone.length === 0) return "Ingresa tu número de teléfono móvil.";
    if (!rawPhone.startsWith("0"))
      return "El teléfono debe iniciar con 0 (ej. 0991234567).";
    if (rawPhone.length < 10)
      return `Debe tener 10 dígitos (llevas ${rawPhone.length} de 10).`;
    if (rawPhone.length > 10) return "Máximo 10 dígitos permitidos.";
    return null;
  };

  const getPasswordError = (): string | null => {
    if (!submitted && !touched.password) return null;
    if (isAlreadyRegistered && password.length === 0) return null;
    if (password.length === 0) return "Ingresa tu contraseña.";
    if (!hasLengthRange) return "La contraseña debe tener entre 8 y 12 caracteres.";
    if (!hasUppercase) return "Debe incluir al menos una letra mayúscula.";
    if (!hasNumber) return "Debe incluir al menos un número.";
    return null;
  };

  const getConfirmationError = (): string | null => {
    if (!submitted && !touched.confirmation) return null;
    if (isAlreadyRegistered && confirmation.length === 0) return null;
    if (confirmation.length === 0) return "Confirma tu contraseña.";
    if (!isConfirmationMatch) return "Las contraseñas no coinciden.";
    return null;
  };

  const getTermsError = (): string | null => {
    if (!submitted) return null;
    if (!acceptedTerms)
      return "Debes aceptar los Términos y Condiciones para continuar.";
    return null;
  };

  const firstNameError = getFirstNameError();
  const lastNameError = getLastNameError();
  const emailError = getEmailError();
  const phoneError = getPhoneError();
  const passwordErrorMsg = getPasswordError();
  const confirmationError = getConfirmationError();
  const termsError = getTermsError();

  const handlePressSubmit = () => {
    setSubmitted(true);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmation: true,
    });

    if (!isFormValid) {
      const firstErrorMessage =
        getFirstNameError() ||
        getLastNameError() ||
        getEmailError() ||
        getPhoneError() ||
        getPasswordError() ||
        getConfirmationError() ||
        getTermsError() ||
        "Por favor completa correctamente todos los campos.";
      a.run(() => {
        throw Error(firstErrorMessage);
      });
      return;
    }

    void create();
  };

  const create = () =>
    a.asyncRun(async () => {
      if (isAlreadyRegistered) {
        navigation.navigate("KycUpload");
        return;
      }
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
      onBack={handleBack}
      footer={
        <View style={styles.footerContainer}>
          <Pressable
            accessibilityRole="button"
            disabled={a.busy}
            onPress={handlePressSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              a.busy && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}
            testID="register_submit_button"
          >
            <Text style={styles.submitButtonText}>
              {a.busy
                ? "Guardando datos..."
                : isAlreadyRegistered
                ? "Continuar a verificación de cédula"
                : "Crear cuenta y continuar"}
            </Text>
            {!a.busy && <Icon name="arrow-forward" size={18} color="#FFFFFF" />}
          </Pressable>

          <Pressable
            onPress={handleBack}
            style={styles.backLinkRow}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Icon name="arrow-back" size={15} color="#0F4C81" />
            <Text style={styles.backLinkText}>Volver a Iniciar sesión</Text>
          </Pressable>
        </View>
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.charCounter}>{firstName.length}/50</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              !!firstNameError && styles.inputContainerError,
            ]}
          >
            <Icon
              name="person-outline"
              size={18}
              color={firstNameError ? "#DC2626" : "#64748B"}
            />
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              onBlur={() => markTouched("firstName")}
              placeholder="Ej. María"
              placeholderTextColor="#94A3B8"
              maxLength={50}
              autoComplete="given-name"
              textContentType="givenName"
              style={styles.textInput}
              testID="register_first_name"
            />
          </View>
          {firstNameError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{firstNameError}</Text>
            </View>
          )}
        </View>

        {/* Apellido */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Apellido</Text>
            <Text style={styles.charCounter}>{lastName.length}/50</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              !!lastNameError && styles.inputContainerError,
            ]}
          >
            <Icon
              name="person-outline"
              size={18}
              color={lastNameError ? "#DC2626" : "#64748B"}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              onBlur={() => markTouched("lastName")}
              placeholder="Ej. Torres"
              placeholderTextColor="#94A3B8"
              maxLength={50}
              autoComplete="family-name"
              textContentType="familyName"
              style={styles.textInput}
              testID="register_last_name"
            />
          </View>
          {lastNameError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{lastNameError}</Text>
            </View>
          )}
        </View>

        {/* Correo electrónico */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.charCounter}>{email.length}/50</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              !!emailError && styles.inputContainerError,
            ]}
          >
            <Icon
              name="mail-outline"
              size={18}
              color={emailError ? "#DC2626" : "#64748B"}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched("email")}
              placeholder="maria.torres@email.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              maxLength={50}
              style={styles.textInput}
              testID="register_email"
            />
          </View>
          {emailError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          )}
        </View>

        {/* Teléfono móvil con prefijo de Ecuador */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Teléfono móvil</Text>
            <Text style={styles.charCounter}>{rawPhone.length}/10</Text>
          </View>
          <View style={styles.phoneRow}>
            <View
              style={[
                styles.countryCodeBadge,
                !!phoneError && styles.inputContainerError,
              ]}
            >
              <Text style={styles.countryCodeText}>EC +593</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                styles.phoneInputContainer,
                !!phoneError && styles.inputContainerError,
              ]}
            >
              <Icon
                name="call-outline"
                size={18}
                color={phoneError ? "#DC2626" : "#64748B"}
              />
              <TextInput
                value={phone}
                onChangeText={(v) => {
                  const cleaned = v.replace(/\D/g, "").slice(0, 10);
                  setPhone(cleaned);
                }}
                onBlur={() => markTouched("phone")}
                placeholder="0991234567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                autoComplete="tel"
                style={styles.textInput}
                testID="register_phone"
              />
            </View>
          </View>
          {phoneError ? (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : (
            <Text style={styles.helperText}>
              10 dígitos iniciando con 0 (ej. 0991234567).
            </Text>
          )}
        </View>

        {/* Contraseña */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Contraseña</Text>
            <Text style={styles.charCounter}>{password.length}/12</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              !!passwordErrorMsg && styles.inputContainerError,
            ]}
          >
            <Icon
              name="lock-closed-outline"
              size={18}
              color={passwordErrorMsg ? "#DC2626" : "#64748B"}
            />
            <TextInput
              value={password}
              onChangeText={(v) => setPassword(v.slice(0, 12))}
              onBlur={() => markTouched("password")}
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

          {passwordErrorMsg && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{passwordErrorMsg}</Text>
            </View>
          )}

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
                  {isPasswordValid
                    ? "Segura"
                    : hasMinChars && hasMaxChars
                    ? "Media"
                    : "Débil"}
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <Text style={styles.charCounter}>{confirmation.length}/12</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              !!confirmationError && styles.inputContainerError,
            ]}
          >
            <Icon
              name="lock-closed-outline"
              size={18}
              color={confirmationError ? "#DC2626" : "#64748B"}
            />
            <TextInput
              value={confirmation}
              onChangeText={(v) => setConfirmation(v.slice(0, 12))}
              onBlur={() => markTouched("confirmation")}
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
          {confirmationError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{confirmationError}</Text>
            </View>
          )}
        </View>

        {/* Términos y Condiciones */}
        <View style={styles.fieldGroup}>
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
                !!termsError && styles.checkboxError,
              ]}
            >
              {acceptedTerms && (
                <Icon name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              Acepto los{" "}
              <Text style={styles.termsLink}>Términos y Condiciones</Text> y la{" "}
              <Text style={styles.termsLink}>Política de Privacidad</Text> de
              CFL.
            </Text>
          </Pressable>
          {termsError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={13} color="#DC2626" />
              <Text style={styles.errorText}>{termsError}</Text>
            </View>
          )}
        </View>

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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  charCounter: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  helperText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputContainerError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
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
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  phoneInputContainer: {
    flex: 1,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  errorText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
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
  checkboxError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
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
  footerContainer: {
    gap: 10,
    width: "100%",
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
    opacity: 0.6,
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
  backLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F4C81",
  },
});
