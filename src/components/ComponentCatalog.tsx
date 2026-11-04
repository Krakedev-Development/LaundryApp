import { useState } from "react";
import { View } from "react-native";
import {
  Body,
  Button,
  Card,
  Check,
  Choice,
  Field,
  Title,
  useAction,
} from "./ui";
import {
  Accordion,
  SegmentedControl,
  Skeleton,
  StatusChip,
} from "./presentation";
import { FullScreenOverlay } from "./overlay/OverlayPortal";
export function ComponentCatalog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose(): void;
}) {
  const [text, setText] = useState(""),
    [checked, setChecked] = useState(false),
    [segment, setSegment] = useState("first");
  const a = useAction();
  return (
    <FullScreenOverlay
      title="Catálogo de componentes"
      visible={visible && __DEV__}
      onClose={onClose}
    >
      <Body muted>
        Referencia visual de desarrollo. No modifica datos de Laundry.
      </Body>
      <Card>
        <Title>Acciones</Title>
        <Button
          label="Confirmación de ejemplo"
          onPress={() => a.run(() => {}, "Acción de ejemplo completada.")}
        />
        <Button label="Acción secundaria" secondary onPress={() => {}} />
        <Button label="Acción de texto" variant="ghost" onPress={() => {}} />
        <Button label="Acción deshabilitada" disabled onPress={() => {}} />
        <Button label="Guardando" busy onPress={() => {}} />
      </Card>
      <Card>
        <Title>Campos y selección</Title>
        <Field
          label="Correo de ejemplo"
          value={text}
          onChangeText={setText}
          keyboardType="email-address"
          help="Enfoca el campo y prueba un correo incompleto."
        />
        <Check
          label="Confirmación de ejemplo"
          checked={checked}
          onChange={setChecked}
        />
        <Choice label="Opción seleccionada" selected onPress={() => {}} />
        <Choice
          label="Opción deshabilitada"
          selected={false}
          disabled
          onPress={() => {}}
        />
        <SegmentedControl
          value={segment}
          onChange={setSegment}
          options={[
            { value: "first", label: "Primero" },
            { value: "second", label: "Segundo" },
          ]}
        />
      </Card>
      <Card>
        <Title>Estados</Title>
        <View style={{ gap: 8 }}>
          <StatusChip status="IN_PROCESS" />
          <StatusChip status="CUSTOMER_APPROVAL_PENDING" />
          <StatusChip status="COMPLETED" />
          <StatusChip status="INCIDENT" />
        </View>
      </Card>
      <Accordion title="Información desplegable">
        <Body>El contenido aparece después de una acción explícita.</Body>
      </Accordion>
      <Card>
        <Title>Estado de carga</Title>
        <Skeleton />
      </Card>
    </FullScreenOverlay>
  );
}
