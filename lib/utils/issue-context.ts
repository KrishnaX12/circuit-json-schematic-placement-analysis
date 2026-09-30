import type { CircuitJson, SchematicPort, SchematicTrace } from "circuit-json"
import type {
  SchematicBoxPlacement,
  SchematicBoxPlacementLineItem,
  SchematicPlacementIssue,
} from "../types"

const POSITION_EPSILON = 0.01

export interface SchematicSheetContext {
  schematicSheetId?: string
  schematicSheetName?: string
}

export const getRelevantPlacementsForIssues = ({
  issues,
  componentPlacements,
  circuitJson,
}: {
  issues: SchematicPlacementIssue[]
  componentPlacements: SchematicBoxPlacementLineItem[]
  circuitJson: CircuitJson
}): SchematicBoxPlacementLineItem[] => {
  const relevantPlacements = new Set<SchematicBoxPlacementLineItem>()
  const placementByComponentId = new Map(
    componentPlacements.flatMap((placement) =>
      placement.schematicComponentId
        ? [[placement.schematicComponentId, placement] as const]
        : [],
    ),
  )
  const placementsByName = new Map<string, SchematicBoxPlacementLineItem[]>()
  for (const placement of componentPlacements) {
    if (!placement.sourceComponentName) continue
    const namedPlacements = placementsByName.get(placement.sourceComponentName)
    if (namedPlacements) namedPlacements.push(placement)
    else placementsByName.set(placement.sourceComponentName, [placement])
  }

  const addPlacement = (placement?: SchematicBoxPlacement): void => {
    if (!placement) return
    const canonicalPlacement = placement.schematicComponentId
      ? placementByComponentId.get(placement.schematicComponentId)
      : componentPlacements.find(
          (candidate) =>
            candidate.sourceComponentId === placement.sourceComponentId &&
            candidate.schX === placement.schX &&
            candidate.schY === placement.schY,
        )
    if (canonicalPlacement) relevantPlacements.add(canonicalPlacement)
  }
  const addComponentName = (
    componentName: string | undefined,
    schematicSheetId?: string,
  ): void => {
    if (!componentName) return
    for (const placement of placementsByName.get(componentName) ?? []) {
      if (
        schematicSheetId === undefined ||
        placement.schematicSheetId === schematicSheetId
      ) {
        relevantPlacements.add(placement)
      }
    }
  }

  for (const issue of issues) {
    switch (issue.lineItemType) {
      case "MosfetGateNetworkNotGrouped":
        addPlacement(issue.mosfetSchematicBox)
        addPlacement(issue.seriesGateResistorSchematicBox)
        addPlacement(issue.gateSourceResistorSchematicBox)
        break
      case "FlybackDiodeSeparatedFromRelayCoil":
        addPlacement(issue.relaySchematicBox)
        addPlacement(issue.diodeSchematicBox)
        break
      case "CurrentSenseShuntSeparatedFromInputs":
        addPlacement(issue.amplifierSchematicBox)
        addPlacement(issue.shuntSchematicBox)
        break
      case "VoltageDividerSupplyResistorBelowGroundResistor":
        addPlacement(issue.supplyResistorSchematicBox)
        addPlacement(issue.groundResistorSchematicBox)
        break
      case "RegulatorCapacitorsOnWrongSides":
        addPlacement(issue.regulatorSchematicBox)
        addPlacement(issue.inputCapacitorSchematicBox)
        addPlacement(issue.outputCapacitorSchematicBox)
        break
      case "UsbSeriesResistorsNotAligned":
        addPlacement(issue.positiveResistorSchematicBox)
        addPlacement(issue.negativeResistorSchematicBox)
        break
      case "LowSideTransistorNotAlignedWithLoad":
        addPlacement(issue.transistorSchematicBox)
        addPlacement(issue.loadSchematicBox)
        addPlacement(issue.baseResistorSchematicBox)
        addPlacement(issue.clampDiodeSchematicBox)
        break
      case "DecouplingCapacitorsNotCloseTogether":
        for (const placement of issue.capacitorSchematicBoxes)
          addPlacement(placement)
        break
      case "ConnectorPositionCausesTraceDetours":
        addPlacement(issue.connectorSchematicBox)
        for (const placement of issue.connectedComponents)
          addPlacement(placement)
        break
      case "ResetNetworkNotGrouped":
        addPlacement(issue.hostSchematicBox)
        for (const placement of issue.supportNetworkComponents)
          addPlacement(placement)
        break
      case "SchematicTextCollision":
        if (issue.collidingObject.schematicComponentId)
          addPlacement(
            placementByComponentId.get(
              issue.collidingObject.schematicComponentId,
            ),
          )
        if (issue.collidingObject.type === "trace") {
          for (const placement of getTraceEndpointPlacements({
            schematicTraceId: issue.collidingObject.id,
            circuitJson,
            placementByComponentId,
          }))
            addPlacement(placement)
        }
        break
      case "ComponentOverlap":
        addPlacement(issue.firstComponent)
        addPlacement(issue.secondComponent)
        break
      case "SchematicBoxHasALotOfSurroundingWhitespace":
      case "CapacitorSymbolHorizontal":
      case "PinHeaderSchematicBoxTooWide":
      case "GenericSchematicBoxTooWide":
      case "SchematicBoxInnerLabelCollision":
      case "SchematicPinPaddingToEdgeTooLarge":
        addPlacement(issue.schematicBox)
        break
      case "VerboseSchematicNetLabel":
        for (const pin of issue.involvedPins) {
          addComponentName(getComponentNameFromPin(pin), issue.schematicSheetId)
        }
        break
      case "DiodeResistorNotAligned":
        addPlacement(issue.diodeSchematicBox)
        addPlacement(issue.resistorSchematicBox)
        break
      case "ComponentPinsWouldAlignWithVerticalShift":
        addPlacement(issue.firstComponent)
        addPlacement(issue.secondComponent)
        addPlacement(issue.targetComponent)
        break
      case "TraceCanBeSimplifiedByMovingComponent":
        addPlacement(issue.targetComponent)
        for (const placement of getTraceEndpointPlacements({
          schematicTraceId: issue.schematicTraceId,
          circuitJson,
          placementByComponentId,
        })) {
          relevantPlacements.add(placement)
        }
        break
      case "CrystalNotCenteredOverLoadCapacitors":
        addPlacement(issue.crystalSchematicBox)
        addPlacement(issue.firstLoadCapacitorSchematicBox)
        addPlacement(issue.secondLoadCapacitorSchematicBox)
        break
      case "TwoPinComponentCouldBeFlipped":
        addPlacement(issue.targetComponent)
        addPlacement(issue.connectedComponent)
        break
      case "FeedbackNetworkNotCompact":
        addPlacement(issue.amplifierSchematicBox)
        for (const component of issue.feedbackComponents)
          addPlacement(component)
        break
      case "TwoPinComponentShouldBeVertical":
      case "TwoPinComponentHasInvertedRails":
      case "TwoPinPullupPowerBelowSignal":
        addPlacement(issue.schematicBox)
        break
      case "PullResistorOnWrongSide":
        addPlacement(issue.resistorSchematicBox)
        addPlacement(issue.hostSchematicBox)
        break
      case "ComponentNetLabelCollision":
        addPlacement(issue.firstComponent)
        addPlacement(issue.secondComponent)
        break
      case "ComponentBoxNetLabelCollision":
        addPlacement(issue.boxComponent)
        addPlacement(issue.labelComponent)
        break
      case "NetLabelCollision":
        for (const pair of issue.pairs) {
          addComponentName(pair.comp1Name, issue.schematicSheetId)
          addComponentName(pair.comp2Name, issue.schematicSheetId)
        }
        for (const move of issue.moves) {
          addComponentName(move.componentName, issue.schematicSheetId)
        }
        break
    }
  }

  return componentPlacements.filter((placement) =>
    relevantPlacements.has(placement),
  )
}

export const getIssueSchematicSheetContext = (
  issue: SchematicPlacementIssue,
): SchematicSheetContext => {
  if ("schematicSheetId" in issue || "schematicSheetName" in issue) {
    const schematicSheetId =
      "schematicSheetId" in issue && typeof issue.schematicSheetId === "string"
        ? issue.schematicSheetId
        : undefined
    const schematicSheetName =
      "schematicSheetName" in issue &&
      typeof issue.schematicSheetName === "string"
        ? issue.schematicSheetName
        : undefined
    if (schematicSheetId || schematicSheetName) {
      return { schematicSheetId, schematicSheetName }
    }
  }

  // Group diagnostics carry their placements in an array instead of a pair.
  for (const value of Object.values(issue).flat()) {
    if (isSchematicBoxPlacement(value)) {
      return {
        schematicSheetId: value.schematicSheetId,
        schematicSheetName: value.schematicSheetName,
      }
    }
  }
  return {}
}

const getComponentNameFromPin = (pin: string): string => {
  const separatorIndex = pin.lastIndexOf(".")
  return separatorIndex === -1 ? pin : pin.slice(0, separatorIndex)
}

const isSchematicBoxPlacement = (
  value: unknown,
): value is SchematicBoxPlacement =>
  Boolean(
    value &&
      typeof value === "object" &&
      "positionAnchor" in value &&
      value.positionAnchor === "center" &&
      "schX" in value &&
      "schY" in value &&
      "width" in value &&
      "height" in value,
  )

const getTraceEndpointPlacements = ({
  schematicTraceId,
  circuitJson,
  placementByComponentId,
}: {
  schematicTraceId: string
  circuitJson: CircuitJson
  placementByComponentId: Map<string, SchematicBoxPlacementLineItem>
}): SchematicBoxPlacementLineItem[] => {
  const trace = circuitJson.find(
    (element): element is SchematicTrace =>
      element.type === "schematic_trace" &&
      element.schematic_trace_id === schematicTraceId,
  )
  const firstEdge = trace?.edges[0]
  const lastEdge = trace?.edges.at(-1)
  if (!trace || !firstEdge || !lastEdge) return []

  const ports = circuitJson.filter(
    (element): element is SchematicPort => element.type === "schematic_port",
  )
  const portsById = new Map(ports.map((port) => [port.schematic_port_id, port]))
  const endpointPorts = [
    firstEdge.from_schematic_port_id
      ? portsById.get(firstEdge.from_schematic_port_id)
      : findPortAtPoint(ports, firstEdge.from, trace.schematic_sheet_id),
    lastEdge.to_schematic_port_id
      ? portsById.get(lastEdge.to_schematic_port_id)
      : findPortAtPoint(ports, lastEdge.to, trace.schematic_sheet_id),
  ]

  return endpointPorts.flatMap((port) => {
    const placement = port?.schematic_component_id
      ? placementByComponentId.get(port.schematic_component_id)
      : undefined
    return placement ? [placement] : []
  })
}

const findPortAtPoint = (
  ports: SchematicPort[],
  point: { x: number; y: number },
  schematicSheetId?: string,
): SchematicPort | undefined =>
  ports.find(
    (port) =>
      port.schematic_sheet_id === schematicSheetId &&
      Math.abs(port.center.x - point.x) <= POSITION_EPSILON &&
      Math.abs(port.center.y - point.y) <= POSITION_EPSILON,
  )
