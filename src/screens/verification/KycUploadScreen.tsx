import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Stepper } from "../../components/presentation";
import { Page } from "../../components/Page";
import {
  Body,
  Button,
  Card,
  Field,
  Icon,
  ui,
  useAction,
} from "../../components/ui";
import { PhotoAttachment } from "../../components/PhotoAttachment";
import { useApp } from "../../store/AppProvider";
import {
  kycService,
  type KycDocumentType,
  type KycState,
} from "../../services/kyc/kycService";

// Verificación de identidad: selfie, cédula por ambos lados y número de cédula.
const STEPS = [
  "Selfie",
  "Cédula, frente",
  "Cédula, reverso",
  "Confirmar número",
] as const;
const PHOTO_STEPS: {
  type: KycDocumentType;
  label: string;
  help: string;
  selfie: boolean;
}[] = [
  {
    type: "SELFIE",
    label: "Selfie de verificación",
    help: "Tómate una selfie con el rostro descubierto, de frente y con buena luz.",
    selfie: true,
  },
  {
    type: "ID_FRONT",
    label: "Cédula, lado frontal",
    help: "Fotografía el frente de tu cédula completa, sin reflejos ni recortes.",
    selfie: false,
  },
  {
    type: "ID_BACK",
    label: "Cédula, lado posterior",
    help: "Fotografía el reverso de tu cédula completa, sin reflejos ni recortes.",
    selfie: false,
  },
];

export function KycUploadScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [kyc, setKyc] = useState<KycState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [local, setLocal] = useState<Partial<Record<KycDocumentType, string>>>(
    {},
  );
  // Imágenes ya enviadas al servidor desde este dispositivo, para no repetirlas.
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
        // Retoma donde quedó: primera imagen que el servidor aún no tiene.
        const pending = PHOTO_STEPS.findIndex(
          (p) => !state.uploaded.includes(p.type),
        );
        setStep(pending === -1 ? STEPS.length : pending + 1);
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
    // Solo al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photo = step <= PHOTO_STEPS.length ? PHOTO_STEPS[step - 1] : null;
  const onServer = (type: KycDocumentType) => !!kyc?.uploaded.includes(type);
  const ready = photo ? !!local[photo.type] || onServer(photo.type) : false;
  const numberOk = /^\d{10}$/.test(number.trim());

  const goNext = () =>
    a.asyncRun(async () => {
      if (!photo) return;
      const uri = local[photo.type];
      // Solo se sube lo que cambió: lo que ya está en el servidor se conserva.
      if (uri && sent[photo.type] !== uri) {
        apply(await kycService.upload(photo.type, uri));
        setSent((prev) => ({ ...prev, [photo.type]: uri }));
      }
      setStep(step + 1);
    });

  const submit = () =>
    a.asyncRun(async () => {
      if (!numberOk) throw Error("La cédula debe tener 10 dígitos.");
      const state = await kycService.submit(number);
      setKyc(state);
      // El servidor la deja pendiente; la navegación pasa a la pantalla de espera.
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
      onBack={step > 1 ? () => setStep(step - 1) : undefined}
      footer={
        photo ? (
          <Button
            label="Continuar"
            disabled={!ready}
            busy={a.busy}
            onPress={() => void goNext()}
            testID="kyc_next_button"
          />
        ) : (
          <Button
            label="Enviar verificación"
            disabled={!numberOk}
            busy={a.busy}
            onPress={() => void submit()}
            testID="kyc_submit_button"
          />
        )
      }
    >
      <Stepper step={step} labels={STEPS} />
      {kyc.status === "REJECTED" && kyc.rejectionReason ? (
        <Card>
          <Body>Motivo del rechazo anterior: {kyc.rejectionReason}</Body>
          <Body muted>
            Reenvíos restantes: {kyc.resubmissionsLeft}.
          </Body>
        </Card>
      ) : null}
      {photo ? (
        <Card>
          <Icon
            name={photo.selfie ? "person-circle-outline" : "card-outline"}
            size={42}
          />
          <Body>{photo.help}</Body>
          {local[photo.type] ? (
            <Image
              source={{ uri: local[photo.type] }}
              accessibilityLabel={`Vista previa: ${photo.label}`}
              style={{ width: "100%", height: 200, borderRadius: 12 }}
              resizeMode="contain"
            />
          ) : onServer(photo.type) ? (
            <Body muted>
              Ya subiste esta imagen. Puedes continuar o reemplazarla.
            </Body>
          ) : null}
          <PhotoAttachment
            label={photo.label}
            uri={local[photo.type]}
            selfie={photo.selfie}
            onChange={(uri) => setLocal((prev) => ({ ...prev, [photo.type]: uri }))}
          />
          {a.feedback}
        </Card>
      ) : (
        <Card>
          <Body>
            Escribe el número de tu cédula tal como aparece en el documento.
            Lo usaremos para confirmar que es correcto.
          </Body>
          <View style={[ui.row, { gap: 8 }]}>
            {PHOTO_STEPS.map((p) => (
              <View key={p.type} style={[ui.row, { gap: 4 }]}>
                <Icon name="checkmark-circle-outline" />
                <Body muted>{p.label}</Body>
              </View>
            ))}
          </View>
          <Field
            label="Número de cédula"
            value={number}
            onChangeText={(v) => setNumber(v.replace(/\D/g, "").slice(0, 10))}
            keyboardType="number-pad"
            maxLength={10}
            validate={(v) =>
              /^\d{10}$/.test(v) ? undefined : "La cédula debe tener 10 dígitos."
            }
            testID="kyc_document_number"
          />
          {a.feedback}
        </Card>
      )}
    </Page>
  );
}
