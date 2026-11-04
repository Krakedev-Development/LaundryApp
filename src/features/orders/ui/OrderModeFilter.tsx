import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { Choice } from "../../../components/ui";
import { modeLabels, type Mode } from "../../../domain/models";

export function OrderModeFilter({
  mode,
  visible,
  onChange,
  onClose,
}: {
  mode: Mode | "ALL";
  visible: boolean;
  onChange(value: Mode | "ALL"): void;
  onClose(): void;
}) {
  return (
    <BottomSheet title="Filtrar modalidad" visible={visible} onClose={onClose}>
      <Choice
        label="Todas las modalidades"
        selected={mode === "ALL"}
        onPress={() => {
          onChange("ALL");
          onClose();
        }}
      />
      {Object.entries(modeLabels).map(([key, label]) => (
        <Choice
          key={key}
          label={label}
          selected={mode === key}
          onPress={() => {
            onChange(key as Mode);
            onClose();
          }}
        />
      ))}
    </BottomSheet>
  );
}
