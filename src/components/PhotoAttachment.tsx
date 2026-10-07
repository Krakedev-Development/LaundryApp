import { View } from "react-native";
import { Body, Button, Icon, ui, useAction } from "./ui";
import { pickPhoto } from "../services/media";
export function PhotoAttachment({
  label,
  uri,
  onChange,
  selfie = false,
}: {
  label: string;
  uri?: string;
  onChange(uri: string): void;
  selfie?: boolean;
}) {
  const action = useAction();
  return (
    <View style={{ gap: 10 }}>
      <View style={ui.row}>
        <Icon name={uri ? "checkmark-circle-outline" : "camera-outline"} />
        <Body>{uri ? `${label}: archivo adjunto` : label}</Body>
      </View>
      {action.feedback}
      <Button
        label={selfie ? "Tomar selfie" : "Tomar foto"}
        icon="camera-outline"
        secondary
        busy={action.busy}
        onPress={() => {
          void action.asyncRun(async () => {
            const selected = await pickPhoto("camera", selfie);
            if (selected) onChange(selected);
          });
        }}
      />
      <Button
        label="Elegir imagen del dispositivo"
        icon="image-outline"
        secondary
        busy={action.busy}
        onPress={() => {
          void action.asyncRun(async () => {
            const selected = await pickPhoto("library", selfie);
            if (selected) onChange(selected);
          });
        }}
      />
    </View>
  );
}
