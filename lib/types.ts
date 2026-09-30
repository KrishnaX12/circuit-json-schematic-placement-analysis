export interface SchematicBoxPlacement {
  positionAnchor: "center"
  schX: number
  schY: number
  width: number
  height: number
  schematicSheetId?: string
  schematicSheetName?: string
  sourceComponentId?: string
  sourceComponentName?: string
  schematicComponentId?: string
  schematicSymbolId?: string
  subcircuitId?: string
}

export interface SchematicBoxPlacementLineItem extends SchematicBoxPlacement {
  lineItemType: "SchematicBoxPlacement"
}

export interface ComponentOverlap {
  lineItemType: "ComponentOverlap"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  overlapWidth: number
  overlapHeight: number
  correctionSuggestions: OverlapCorrectionSuggestion[]
}

export interface OverlapCorrectionSuggestion {
  targetComponentName?: string
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
}

export interface SchematicBoxHasALotOfSurroundingWhitespace {
  lineItemType: "SchematicBoxHasALotOfSurroundingWhitespace"
  schematicBox: SchematicBoxPlacement
  whitespaceLeft: number
  whitespaceRight: number
  whitespaceTop: number
  whitespaceBottom: number
}

export interface CapacitorSymbolHorizontal {
  lineItemType: "CapacitorSymbolHorizontal"
  schematicBox: SchematicBoxPlacement
  message: string
}

/** A power-to-ground capacitor bank is spread out within one schematic block. */
export interface DecouplingCapacitorsNotCloseTogether {
  lineItemType: "DecouplingCapacitorsNotCloseTogether"
  railName: string
  groundName: string
  /** All capacitors in this bank, sharing supply, return, and schematic scope. */
  capacitorSchematicBoxes: SchematicBoxPlacement[]
  /** Largest gap between any two component bounds in the bank. */
  maxBodyGap: number
  maxRecommendedBodyGap: number
  message: string
}

export interface VerboseSchematicNetLabel {
  lineItemType: "VerboseSchematicNetLabel"
  schematicNetLabelId?: string
  sourceNetId?: string
  schematicSheetId?: string
  schematicSheetName?: string
  text: string
  involvedPins: string[]
  schX: number
  schY: number
  message: string
}

interface BaseSchematicBoxTooWide {
  schematicBox: SchematicBoxPlacement
  measuredInnerLabelHorizontalEmptySpace: number
  maxAllowedInnerLabelHorizontalEmptySpace: number
  suggestedSchWidth: number
  message: string
}

export interface PinHeaderSchematicBoxTooWide extends BaseSchematicBoxTooWide {
  lineItemType: "PinHeaderSchematicBoxTooWide"
}

export interface GenericSchematicBoxTooWide extends BaseSchematicBoxTooWide {
  lineItemType: "GenericSchematicBoxTooWide"
}

export type SchematicBoxTooWideIssue =
  | PinHeaderSchematicBoxTooWide
  | GenericSchematicBoxTooWide

export interface SchematicBoxInnerLabelCollision {
  lineItemType: "SchematicBoxInnerLabelCollision"
  schematicBox: SchematicBoxPlacement
  overlappingSides: SchematicSide[]
  message: string
}

export type SchematicSide = "left" | "right" | "top" | "bottom"

export type SchematicPortFacingDirection = "left" | "right" | "up" | "down"

export interface SchematicPinPaddingToEdgeTooLarge {
  lineItemType: "SchematicPinPaddingToEdgeTooLarge"
  pinSide: SchematicSide
  edgeSide: SchematicSide
  pinName?: string
  schematicBox: SchematicBoxPlacement
  measuredPadding: number
  maxAllowedPadding: number
  excessPadding: number
  /** All excessive gaps for this box; scalar gap fields identify the worst gap. */
  paddingDetails?: Array<{
    pinSide: SchematicSide
    edgeSide: SchematicSide
    pinName?: string
    measuredPadding: number
    maxAllowedPadding: number
    excessPadding: number
  }>
  suggestedSchWidth?: number
  suggestedSchHeight?: number
  message: string
}

export interface DiodeResistorNotAligned {
  lineItemType: "DiodeResistorNotAligned"
  diodeSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  diodePin?: string
  resistorPin?: string
  diodePinFacingDirection?: string
  resistorPinFacingDirection?: string
  message: string
}

export interface ComponentPinsWouldAlignWithVerticalShift {
  lineItemType: "ComponentPinsWouldAlignWithVerticalShift"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  targetComponent: SchematicBoxPlacement
  deltaSchY: number
  newSchY: number
  currentlyAlignedPinCount: number
  alignedPinCount: number
  alignedPinPairs: Array<{
    firstPin?: string
    secondPin?: string
  }>
  message: string
}

export interface TraceCanBeSimplifiedByMovingComponent {
  lineItemType: "TraceCanBeSimplifiedByMovingComponent"
  schematicTraceId: string
  traceName?: string
  targetComponent: SchematicBoxPlacement
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
  currentTurnCount: number
  suggestedTurnCount: number
  /** Collision-checked calculate-elbow routes after applying this move. */
  suggestedTraces?: Array<{
    schematicTraceId: string
    points: Array<{ x: number; y: number }>
  }>
  message: string
}

export interface CrystalNotCenteredOverLoadCapacitors {
  lineItemType: "CrystalNotCenteredOverLoadCapacitors"
  crystalSchematicBox: SchematicBoxPlacement
  firstLoadCapacitorSchematicBox: SchematicBoxPlacement
  secondLoadCapacitorSchematicBox: SchematicBoxPlacement
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
  message: string
}

export interface TwoPinComponentCouldBeFlipped {
  lineItemType: "TwoPinComponentCouldBeFlipped"
  schematicTraceId: string
  traceName?: string
  targetComponent: SchematicBoxPlacement
  connectedComponent: SchematicBoxPlacement
  targetPin?: string
  currentFacingDirection: SchematicPortFacingDirection
  suggestedFacingDirection: SchematicPortFacingDirection
  deltaSchRotation: 180
  currentTurnCount: number
  suggestedTurnCount: number
  message: string
}

/** Advisory: a direct negative-feedback R/C network is far from its amplifier. */
export interface FeedbackNetworkNotCompact {
  lineItemType: "FeedbackNetworkNotCompact"
  amplifierSchematicBox: SchematicBoxPlacement
  feedbackComponents: SchematicBoxPlacement[]
  distantComponents: Array<{
    schematicBox: SchematicBoxPlacement
    bodyGap: number
    maxRecommendedBodyGap: number
  }>
  outputSourcePortId: string
  invertingInputSourcePortId: string
  message: string
}

/** Advisory: an explicitly identified pull resistor is far on the unconventional side. */
export interface PullResistorOnWrongSide {
  lineItemType: "PullResistorOnWrongSide"
  resistorSchematicBox: SchematicBoxPlacement
  hostSchematicBox: SchematicBoxPlacement
  signalSourcePortId: string
  signalPinName: string
  signalSchY: number
  pullDirection: "up" | "down"
  preferredSide: "above" | "below"
  wrongSideGap: number
  maxRecommendedWrongSideGap: number
  message: string
}

interface TwoPinComponentRailOrientation {
  schematicBox: SchematicBoxPlacement
  railSourcePortId: string
  railPinName: string
  railType: "power" | "ground"
  suggestedRailFacingDirection: "up" | "down"
  message: string
}

export interface TwoPinComponentShouldBeVertical
  extends TwoPinComponentRailOrientation {
  lineItemType: "TwoPinComponentShouldBeVertical"
  deltaSchRotation: -90 | 90
}

/** A vertical component has an explicitly positive supply below its ground pin. */
export interface TwoPinComponentHasInvertedRails
  extends TwoPinComponentRailOrientation {
  lineItemType: "TwoPinComponentHasInvertedRails"
  railType: "power"
  deltaSchRotation: 180
  suggestedRailFacingDirection: "up"
}

/** A vertical pull-up resistor has its power terminal below its signal terminal. */
export interface TwoPinPullupPowerBelowSignal
  extends TwoPinComponentRailOrientation {
  lineItemType: "TwoPinPullupPowerBelowSignal"
  railType: "power"
  deltaSchRotation: 180
  suggestedRailFacingDirection: "up"
}

export interface ComponentNetLabelCollision {
  lineItemType: "ComponentNetLabelCollision"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  message: string
  overlappingLabel1Bounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  overlappingLabel2Bounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  suggestion?: {
    componentName: string
    newSchX: number
    newSchY: number
  }
}

export interface ComponentBoxNetLabelCollision {
  lineItemType: "ComponentBoxNetLabelCollision"
  boxComponent: SchematicBoxPlacement
  labelComponent: SchematicBoxPlacement
  message: string
  boxBounds: { left: number; right: number; top: number; bottom: number }
  labelBounds: { left: number; right: number; top: number; bottom: number }
  suggestion?: {
    componentName: string
    newSchX: number
    newSchY: number
  }
}

export interface SchematicIssueBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export interface NetLabelCollision {
  lineItemType: "NetLabelCollision"
  schematicSheetId?: string
  schematicSheetName?: string
  /** Actual intersection regions in schematic coordinates (Y up).
   * Optional for compatibility with previously serialized reports. */
  collisionBounds?: SchematicIssueBounds[]
  pairs: Array<{ comp1Name: string; comp2Name: string }>
  moves: Array<{
    componentName: string
    newSchX: number
    newSchY: number
  }>
}

export interface SchematicTextCollisionObject {
  type: "text" | "trace" | "component"
  id: string
  text?: string
  componentName?: string
  schematicComponentId?: string
}

export interface SchematicTextCollision {
  lineItemType: "SchematicTextCollision"
  schematicSheetId?: string
  schematicSheetName?: string
  schematicTextId: string
  text: string
  collidingObject: SchematicTextCollisionObject
  textBounds: { left: number; right: number; top: number; bottom: number }
  collidingObjectBounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  /** A clear text-anchor position for this issue; reanalyze after applying it. */
  suggestedMove?: { newSchX: number; newSchY: number }
  message: string
}

export interface ResetNetworkNotGrouped {
  lineItemType: "ResetNetworkNotGrouped"
  /** The component whose reset pin is served by this network. */
  hostSchematicBox: SchematicBoxPlacement
  resetSourcePortId: string
  resetPinName: string
  /** Reset pull-up, capacitor, and any associated test points; excludes the host. */
  supportNetworkComponents: SchematicBoxPlacement[]
  maxDistanceFromResetPin: number
  maxRecommendedDistance: number
  message: string
}

export interface ConnectorPositionCausesTraceDetours {
  lineItemType: "ConnectorPositionCausesTraceDetours"
  connectorSchematicBox: SchematicBoxPlacement
  connectedComponents: SchematicBoxPlacement[]
  /** Existing routed signal connections that demonstrate the detours. */
  schematicTraceIds: string[]
  evaluatedSignalCount: number
  newSchX: number
  newSchY: number
  deltaSchX: number
  deltaSchY: number
  /** Sum of Manhattan distances between the evaluated signal pins. */
  currentTotalSignalDistance: number
  /** Sum of Manhattan pin distances after moving; not a promised routed length. */
  suggestedTotalSignalDistance: number
  message: string
}

/** Advisory for a grounded-emitter NPN switch; no automatic move is implied. */
export interface LowSideTransistorNotAlignedWithLoad {
  lineItemType: "LowSideTransistorNotAlignedWithLoad"
  transistorSchematicBox: SchematicBoxPlacement
  loadSchematicBox: SchematicBoxPlacement
  baseResistorSchematicBox: SchematicBoxPlacement
  clampDiodeSchematicBox: SchematicBoxPlacement
  collectorSourcePortId: string
  emitterSourcePortId: string
  collectorFacingDirection: SchematicPortFacingDirection
  emitterFacingDirection: SchematicPortFacingDirection
  placementProblems: Array<
    "transistor_not_below_load" | "collector_not_up" | "emitter_not_down"
  >
  message: string
}

/** Advisory for an electrically identified USB series pair drawn end-to-end. */
export interface UsbSeriesResistorsNotAligned {
  lineItemType: "UsbSeriesResistorsNotAligned"
  positiveResistorSchematicBox: SchematicBoxPlacement
  negativeResistorSchematicBox: SchematicBoxPlacement
  hostSourceComponentId: string
  positiveSourcePortId: string
  negativeSourcePortId: string
  signalAxis: "horizontal" | "vertical"
  message: string
}

/** Advisory for a regulator's local input/output capacitor pair on reversed sides. */
export interface RegulatorCapacitorsOnWrongSides {
  lineItemType: "RegulatorCapacitorsOnWrongSides"
  regulatorSchematicBox: SchematicBoxPlacement
  inputCapacitorSchematicBox: SchematicBoxPlacement
  outputCapacitorSchematicBox: SchematicBoxPlacement
  inputSourcePortId: string
  outputSourcePortId: string
  message: string
}

/** Advisory: a vertical divider's supply resistor lies clearly below its ground resistor. */
export interface VoltageDividerSupplyResistorBelowGroundResistor {
  lineItemType: "VoltageDividerSupplyResistorBelowGroundResistor"
  supplyResistorSchematicBox: SchematicBoxPlacement
  groundResistorSchematicBox: SchematicBoxPlacement
  supplyTapSourcePortId: string
  groundTapSourcePortId: string
  reversedBodyGap: number
  message: string
}

/** Series gate and gate-source resistors scattered away from their MOSFET. */
export interface MosfetGateNetworkNotGrouped {
  lineItemType: "MosfetGateNetworkNotGrouped"
  mosfetSchematicBox: SchematicBoxPlacement
  seriesGateResistorSchematicBox: SchematicBoxPlacement
  gateSourceResistorSchematicBox: SchematicBoxPlacement
  /** Largest body-to-body gap from either resistor to the MOSFET. */
  maxBodyGap: number
  maxRecommendedBodyGap: number
  message: string
}

/** A local flyback diode separated from the relay coil it protects. */
export interface FlybackDiodeSeparatedFromRelayCoil {
  lineItemType: "FlybackDiodeSeparatedFromRelayCoil"
  relaySchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  coilSourcePortIds: [string, string]
  distanceFromCoilPins: number
  message: string
}

/** Advisory for a displaced local shunt with one sense branch split by labels. */
export interface CurrentSenseShuntSeparatedFromInputs {
  lineItemType: "CurrentSenseShuntSeparatedFromInputs"
  amplifierSchematicBox: SchematicBoxPlacement
  shuntSchematicBox: SchematicBoxPlacement
  positiveInputSourcePortId: string
  negativeInputSourcePortId: string
  /** Gap from the shunt body to the band spanned by the two input pins. */
  inputBandGap: number
  message: string
}

export type SchematicPlacementIssue =
  | MosfetGateNetworkNotGrouped
  | FlybackDiodeSeparatedFromRelayCoil
  | CurrentSenseShuntSeparatedFromInputs
  | VoltageDividerSupplyResistorBelowGroundResistor
  | RegulatorCapacitorsOnWrongSides
  | UsbSeriesResistorsNotAligned
  | LowSideTransistorNotAlignedWithLoad
  | ComponentOverlap
  | SchematicBoxHasALotOfSurroundingWhitespace
  | CapacitorSymbolHorizontal
  | DecouplingCapacitorsNotCloseTogether
  | VerboseSchematicNetLabel
  | SchematicBoxTooWideIssue
  | SchematicBoxInnerLabelCollision
  | SchematicPinPaddingToEdgeTooLarge
  | DiodeResistorNotAligned
  | ComponentPinsWouldAlignWithVerticalShift
  | TraceCanBeSimplifiedByMovingComponent
  | CrystalNotCenteredOverLoadCapacitors
  | TwoPinComponentCouldBeFlipped
  | FeedbackNetworkNotCompact
  | PullResistorOnWrongSide
  | TwoPinComponentShouldBeVertical
  | TwoPinComponentHasInvertedRails
  | TwoPinPullupPowerBelowSignal
  | ComponentNetLabelCollision
  | ComponentBoxNetLabelCollision
  | NetLabelCollision
  | SchematicTextCollision
  | ResetNetworkNotGrouped
  | ConnectorPositionCausesTraceDetours

export interface SchematicPlacementIssues {
  lineItemType: "SchematicPlacementIssues"
  issues: SchematicPlacementIssue[]
}

export type SchematicPlacementLineItem =
  | SchematicBoxPlacementLineItem
  | SchematicPlacementIssues

/** Select issue types to execute; omitted runs all checks, [] runs none. */
export interface SchematicPlacementAnalysisOptions {
  issueTypes?: readonly SchematicPlacementIssue["lineItemType"][]
}
