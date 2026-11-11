import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Button, Icon, ui, useAction } from "./ui";
import { BottomSheet } from "./overlay/OverlayPortal";
import { pickPhoto } from "../services/media";

export function PhotoAttachment({
  label,
  uri,
  onChange,
  selfie = false,
  aspect = "horizontal",
}: {
  label: string;
  uri?: string;
  onChange(uri: string): void;
  selfie?: boolean;
  aspect?: "horizontal" | "oval" | "square";
}) {
  const action = useAction();
  const [open, setOpen] = useState(false);

  const select = (source: "camera" | "library") => {
    setOpen(false);
    requestAnimationFrame(() => {
      void action.asyncRun(async () => {
        const selected = await pickPhoto(source, selfie);
        if (selected) onChange(selected);
      });
    });
  };

  const triggerCapture = () => {
    if (selfie) {
      // Para selfie: abrir directamente la cámara frontal sin permitir galería
      void action.asyncRun(async () => {
        const selected = await pickPhoto("camera", true);
        if (selected) onChange(selected);
      });
    } else {
      setOpen(true);
    }
  };

  const isCard = aspect === "horizontal";

  return (
    <View style={styles.container}>
      <Pressable
        onPress={triggerCapture}
        accessibilityRole="button"
        accessibilityLabel={`Capturar o adjuntar ${label}`}
        style={[
          styles.guideContainer,
          isCard ? styles.cardGuide : styles.ovalGuide,
          uri ? styles.guideWithImage : null,
        ]}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={styles.imagePreview}
              resizeMode="cover"
              accessibilityLabel={`Foto adjunta: ${label}`}
            />
            <View style={styles.retakeOverlay}>
              <View style={styles.retakeBadge}>
                <Icon name="camera-outline" size={16} />
                <Text style={styles.retakeText}>Cambiar foto</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            {/* Guía visual con esquinas para encuadre */}
            {isCard && (
              <View style={styles.cornersContainer}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            )}

            <View style={styles.iconCircle}>
              <Icon
                name={selfie ? "person-outline" : "camera-outline"}
                size={30}
              />
            </View>
            <Text style={styles.guideTitle}>
              {isCard
                ? "Encuadra la cédula dentro del recuadro"
                : "Ubica tu rostro de frente"}
            </Text>
            <Text style={styles.guideSubtitle}>
              {selfie
                ? "Toca aquí para abrir la cámara y tomar tu selfie"
                : "Toca aquí para tomar la foto o elegir de la galería"}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={[ui.row, { gap: 6, marginTop: 2 }]}>
        <Icon
          name={uri ? "checkmark-circle" : "information-circle-outline"}
          size={18}
        />
        <Body muted style={{ fontSize: 13 }}>
          {uri ? `${label} lista` : "Asegúrate de que la imagen sea nítida"}
        </Body>
      </View>

      {action.feedback}

      {/* Modal solo para documentos que admiten galería (ej. cédula) */}
      {!selfie && (
        <BottomSheet
          title={`Adjuntar ${label.toLowerCase()}`}
          visible={open}
          onClose={() => setOpen(false)}
        >
          <Body muted>
            Asegúrate de que la cédula sea legible, sin brillos ni reflejos.
          </Body>
          <Button
            label="Tomar foto con la cámara"
            icon="camera-outline"
            secondary
            onPress={() => select("camera")}
          />
          <Button
            label="Elegir imagen del dispositivo"
            icon="image-outline"
            secondary
            onPress={() => select("library")}
          />
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  guideContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderColor: "#0F4C81",
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cardGuide: {
    height: 200,
    borderRadius: 16,
    aspectRatio: 1.58, // Proporción ISO standard de tarjeta ID/cédula
    maxWidth: "100%",
    alignSelf: "center",
  },
  ovalGuide: {
    height: 240,
    width: 200,
    borderRadius: 100,
    alignSelf: "center",
  },
  guideWithImage: {
    borderStyle: "solid",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    backgroundColor: "#000",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  retakeOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  retakeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  retakeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F4C81",
    textAlign: "center",
    marginBottom: 4,
  },
  guideSubtitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  cornersContainer: {
    ...StyleSheet.absoluteFill,
    margin: 8,
    pointerEvents: "none",
  },
  corner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: "#0F4C81",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
});
