import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stepper } from "../../components/presentation";
import { Page } from "../../components/Page";
import {
  Body,
  Button,
  Card,
  Field,
  Icon,
  Title,
  useAction,
} from "../../components/ui";
import { PhotoAttachment } from "../../components/PhotoAttachment";
import { useApp } from "../../store/AppProvider";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import {
  kycService,
  type KycDocumentType,
  type KycState,
} from "../../services/kyc/kycService";

// Las 2 etapas de verificación tras el registro del formulario:
// Etapa 2 de 3: Cédula (frontal y reverso) + Confirmar número de cédula
// Etapa 3 de 3: Selfie / Reconocimiento facial
const KYC_STEPS = ["Cédula de identidad", "Foto del rostro"] as const;

export function KycUploadScreen() {
  const { execute } = useApp();
  const a = useAction();
  const navigation = useLaundryNavigation();
  const [kyc, setKyc] = useState<KycState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // currentStep: 1 = Cédula (Frente + Reverso + Número), 2 = Selfie
  const [currentStep, setCurrentStep] = useState(1);

  const [local, setLocal] = useState<Partial<Record<KycDocumentType, string>>>({});
  const [sent, setSent] = useState<Partial<Record<KycDocumentType, string>>>({});
  const [number, setNumber] = useState("");

  const apply = (state: KycState) => {
    setKyc(state);
    if (state.status !== "NOT_SUBMITTED" && state.status !== "REJECTED")
      execute((r) => r.setKycStatus(state.status, state.rejectionReason));
  };

  useEffect(() => {
    let alive = true;
    kycService
      .status()
      .then((state) => {
        if (!alive) return;
        apply(state);
        // Si ya subió ambas caras de la cédula, pasa directo al selfie (Etapa 2)
        const hasId =
          state.uploaded.includes("ID_FRONT") &&
          state.uploaded.includes("ID_BACK");
        if (hasId && !state.uploaded.includes("SELFIE")) {
          setCurrentStep(2);
        }
      })
      .catch((e: unknown) => {
        if (alive)
          setLoadError(
            e instanceof Error ? e.message : "No se pudo consultar tu verificación.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);

  const onServer = (type: KycDocumentType) => !!kyc?.uploaded.includes(type);
  const hasFront = !!local["ID_FRONT"] || onServer("ID_FRONT");
  const hasBack = !!local["ID_BACK"] || onServer("ID_BACK");
  const hasSelfie = !!local["SELFIE"] || onServer("SELFIE");
  const numberOk = /^\d{10}$/.test(number.trim());

  // Paso 1 (Cédula): requiere frente, reverso y número de cédula de 10 dígitos
  const canContinueToSelfie = hasFront && hasBack && numberOk;

  // Subir documentos pendientes de la cédula y avanzar a la selfie
  const handleNextToSelfie = () =>
    a.asyncRun(async () => {
      if (!hasFront || !hasBack)
        throw Error("Toma la foto frontal y posterior de tu cédula.");
      if (!numberOk)
        throw Error("Ingresa el número de tu cédula de 10 dígitos.");

      // Subir ID_FRONT si hay archivo local nuevo
      const frontUri = local["ID_FRONT"];
      if (frontUri && sent["ID_FRONT"] !== frontUri) {
        apply(await kycService.upload("ID_FRONT", frontUri));
        setSent((prev) => ({ ...prev, ID_FRONT: frontUri }));
      }

      // Subir ID_BACK si hay archivo local nuevo
      const backUri = local["ID_BACK"];
      if (backUri && sent["ID_BACK"] !== backUri) {
        apply(await kycService.upload("ID_BACK", backUri));
        setSent((prev) => ({ ...prev, ID_BACK: backUri }));
      }

      setCurrentStep(2);
    });

  // Paso 2 (Selfie): subir selfie y enviar cédula para revisión final
  const handleSubmitAll = () =>
    a.asyncRun(async () => {
      if (!hasSelfie)
        throw Error("Tómate una selfie para verificar tu rostro.");

      // Subir selfie si es nueva
      const selfieUri = local["SELFIE"];
      if (selfieUri && sent["SELFIE"] !== selfieUri) {
        apply(await kycService.upload("SELFIE", selfieUri));
        setSent((prev) => ({ ...prev, SELFIE: selfieUri }));
      }

      // Enviar solicitud con el número de cédula digitado
      const state = await kycService.submit(number);
      setKyc(state);
      execute((r) => r.setKycStatus(state.status, state.rejectionReason));
    });

  if (loadError)
    return (
      <Page>
        <Card>
          <Icon name="cloud-offline-outline" size={42} />
          <Body>{loadError}</Body>
          <Button
            label="Reintentar"
            onPress={() => {
              setLoadError(null);
              setKyc(null);
              void kycService
                .status()
                .then(apply)
                .catch((e: unknown) =>
                  setLoadError(
                    e instanceof Error
                      ? e.message
                      : "No se pudo consultar tu verificación.",
                  ),
                );
            }}
          />
        </Card>
      </Page>
    );

  if (!kyc)
    return (
      <Page>
        <Body muted>Consultando tu verificación...</Body>
      </Page>
    );

  if (!kyc.canSubmit)
    return (
      <Page>
        <Card>
          <Icon name="alert-circle-outline" size={42} />
          <Body>
            Alcanzaste el máximo de reenvíos de verificación. Contacta a soporte
            para continuar.
          </Body>
          <Button
            label="Cerrar sesión"
            secondary
            onPress={() => execute((r) => r.logout())}
          />
        </Card>
      </Page>
    );

  return (
    <Page
      onBack={
        currentStep > 1
          ? () => setCurrentStep(currentStep - 1)
          : () => navigation.navigate("RegisterStep1")
      }
      footer={
        <View style={styles.footerContainer}>
          {currentStep === 1 ? (
            <>
              <Button
                label="Continuar a foto del rostro"
                disabled={!canContinueToSelfie}
                busy={a.busy}
                onPress={() => void handleNextToSelfie()}
                testID="kyc_next_button"
              />
              <Pressable
                onPress={() => navigation.navigate("RegisterStep1")}
                style={styles.backLinkRow}
                accessibilityRole="button"
                hitSlop={8}
                testID="kyc_back_to_register_link"
              >
                <Icon name="arrow-back" size={15} color="#0F4C81" />
                <Text style={styles.backLinkText}>Volver al formulario</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Button
                label="Enviar verificación completa"
                disabled={!hasSelfie}
                busy={a.busy}
                onPress={() => void handleSubmitAll()}
                testID="kyc_submit_button"
              />
              <Pressable
                onPress={() => setCurrentStep(1)}
                style={styles.backLinkRow}
                accessibilityRole="button"
                hitSlop={8}
                testID="kyc_back_to_id_link"
              >
                <Icon name="arrow-back" size={15} color="#0F4C81" />
                <Text style={styles.backLinkText}>Volver a fotos de cédula</Text>
              </Pressable>
            </>
          )}
        </View>
      }
    >
      <Stepper step={currentStep} labels={KYC_STEPS} />

      {kyc.status === "REJECTED" && kyc.rejectionReason ? (
        <Card>
          <Body>Motivo del rechazo anterior: {kyc.rejectionReason}</Body>
          <Body muted>Reenvíos restantes: {kyc.resubmissionsLeft}.</Body>
        </Card>
      ) : null}

      {currentStep === 1 ? (
        <>
          <Body>
            Fotografía ambos lados de tu cédula en el recuadro horizontal y
            confirma tu número.
          </Body>

          {/* Frente de la cédula con recuadro horizontal */}
          <Card>
            <Title>1. Cédula, lado frontal</Title>
            <Body muted>
              Encuadra la cara delantera de tu cédula dentro del recuadro.
            </Body>
            <PhotoAttachment
              label="Frente de la cédula"
              uri={local["ID_FRONT"]}
              aspect="horizontal"
              selfie={false}
              onChange={(uri) =>
                setLocal((prev) => ({ ...prev, ID_FRONT: uri }))
              }
            />
          </Card>

          {/* Reverso de la cédula con recuadro horizontal */}
          <Card>
            <Title>2. Cédula, lado posterior</Title>
            <Body muted>
              Encuadra el reverso de tu cédula dentro del recuadro.
            </Body>
            <PhotoAttachment
              label="Reverso de la cédula"
              uri={local["ID_BACK"]}
              aspect="horizontal"
              selfie={false}
              onChange={(uri) =>
                setLocal((prev) => ({ ...prev, ID_BACK: uri }))
              }
            />
          </Card>

          {/* Confirmar número de cédula */}
          <Card>
            <Title>3. Número de cédula</Title>
            <Body muted>
              Escribe el número de 10 dígitos exactamente como aparece en tu
              cédula física.
            </Body>
            <Field
              label="Número de cédula"
              value={number}
              onChangeText={(v) =>
                setNumber(v.replace(/\D/g, "").slice(0, 10))
              }
              keyboardType="number-pad"
              maxLength={10}
              validate={(v) =>
                /^\d{10}$/.test(v)
                  ? undefined
                  : "La cédula debe tener exactamente 10 dígitos."
              }
              testID="kyc_document_number"
            />
            {a.feedback}
          </Card>
        </>
      ) : (
        /* Etapa 3: Foto del rostro / Selfie */
        <Card>
          <Title>Foto del rostro (Selfie)</Title>
          <Body>
            Tómate una selfie de frente con buena iluminación y el rostro
            despejado para contrastarla con tu cédula.
          </Body>
          <PhotoAttachment
            label="Foto del rostro"
            uri={local["SELFIE"]}
            aspect="oval"
            selfie={true}
            onChange={(uri) => setLocal((prev) => ({ ...prev, SELFIE: uri }))}
          />
          {a.feedback}
        </Card>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    gap: 8,
    width: "100%",
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
  subtleLinkText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
});

