import { MosfetGateNetworkPlacementSolver } from "./solvers/MosfetGateNetworkPlacementSolver/MosfetGateNetworkPlacementSolver"
import { RelayFlybackDiodePlacementSolver } from "./solvers/RelayFlybackDiodePlacementSolver/RelayFlybackDiodePlacementSolver"
import { CurrentSenseShuntPlacementSolver } from "./solvers/CurrentSenseShuntPlacementSolver/CurrentSenseShuntPlacementSolver"
import { VoltageDividerPlacementSolver } from "./solvers/VoltageDividerPlacementSolver/VoltageDividerPlacementSolver"
import { RegulatorInputOutputCapacitorPlacementSolver } from "./solvers/RegulatorInputOutputCapacitorPlacementSolver/RegulatorInputOutputCapacitorPlacementSolver"
import { ConnectorPlacementSolver } from "./solvers/ConnectorPlacementSolver/ConnectorPlacementSolver"
import { LowSideTransistorPlacementSolver } from "./solvers/LowSideTransistorPlacementSolver/LowSideTransistorPlacementSolver"
import { UsbSeriesResistorPlacementSolver } from "./solvers/UsbSeriesResistorPlacementSolver/UsbSeriesResistorPlacementSolver"
import type { CircuitJson } from "circuit-json"
import { CapacitorOrientationSolver } from "./solvers/CapacitorOrientationSolver/CapacitorOrientationSolver"
import { DecouplingCapacitorGroupingSolver } from "./solvers/DecouplingCapacitorGroupingSolver/DecouplingCapacitorGroupingSolver"
import { ComponentNetLabelCollisionSolver } from "./solvers/ComponentNetLabelCollisionSolver/ComponentNetLabelCollisionSolver"
import { ComponentPinAlignmentSolver } from "./solvers/ComponentPinAlignmentSolver/ComponentPinAlignmentSolver"
import { CrystalLoadCapacitorPlacementSolver } from "./solvers/CrystalLoadCapacitorPlacementSolver/CrystalLoadCapacitorPlacementSolver"
import { DiodeResistorAlignmentSolver } from "./solvers/DiodeResistorAlignmentSolver/DiodeResistorAlignmentSolver"
import { FeedbackNetworkPlacementSolver } from "./solvers/FeedbackNetworkPlacementSolver/FeedbackNetworkPlacementSolver"
import { PullResistorPlacementSolver } from "./solvers/PullResistorPlacementSolver/PullResistorPlacementSolver"
import { TwoPinComponentRailOrientationSolver } from "./solvers/TwoPinComponentRailOrientationSolver/TwoPinComponentRailOrientationSolver"
import { SchematicBoxInnerLabelCollisionSolver } from "./solvers/SchematicBoxInnerLabelCollisionSolver/SchematicBoxInnerLabelCollisionSolver"
import { SchematicBoxOverlapSolver } from "./solvers/SchematicBoxOverlapSolver/SchematicBoxOverlapSolver"
import { SchematicBoxTooWideSolver } from "./solvers/SchematicBoxTooWideSolver/SchematicBoxTooWideSolver"
import { SchematicPinPaddingToEdgeSolver } from "./solvers/SchematicPinPaddingToEdgeSolver/SchematicPinPaddingToEdgeSolver"
import { SchematicPlacementPipeline } from "./solvers/SchematicPlacementPipeline/SchematicPlacementPipeline"
import { TraceSimplificationSolver } from "./solvers/TraceSimplificationSolver/TraceSimplificationSolver"
import { TwoPinComponentOrientationSolver } from "./solvers/TwoPinComponentOrientationSolver/TwoPinComponentOrientationSolver"
import { VerboseNetLabelSolver } from "./solvers/VerboseNetLabelSolver/VerboseNetLabelSolver"
import { SchematicTextClearanceSolver } from "./solvers/SchematicTextClearanceSolver/SchematicTextClearanceSolver"
import { ResetNetworkGroupingSolver } from "./solvers/ResetNetworkGroupingSolver/ResetNetworkGroupingSolver"
import type {
  SchematicBoxPlacementLineItem,
  SchematicPlacementIssue,
  SchematicPlacementAnalysisOptions,
  SchematicPlacementLineItem,
} from "./types"
import { addAttr } from "./utils/format"
import {
  getIssueSchematicSheetContext,
  getRelevantPlacementsForIssues,
  type SchematicSheetContext,
} from "./utils/issue-context"

interface SchematicSheetGroup extends SchematicSheetContext {
  placements: SchematicBoxPlacementLineItem[]
  issues: SchematicPlacementIssue[]
}

export class SchematicPlacementAnalysis {
  constructor(
    private readonly lineItems: SchematicPlacementLineItem[],
    private readonly groupBySchematicSheet = false,
  ) {}

  getLineItems(): SchematicPlacementLineItem[] {
    return this.lineItems
  }

  /** Filter emitted issues without rerunning or changing the solvers. */
  getIssues(
    filter: {
      issueTypes?: readonly SchematicPlacementIssue["lineItemType"][]
      schematicSheetId?: string
    } = {},
  ): SchematicPlacementIssue[] {
    return this.lineItems
      .flatMap((item) =>
        item.lineItemType === "SchematicPlacementIssues" ? item.issues : [],
      )
      .filter(
        (issue) =>
          (filter.issueTypes === undefined ||
            filter.issueTypes.includes(issue.lineItemType)) &&
          (filter.schematicSheetId === undefined ||
            (getIssueSchematicSheetContext(issue).schematicSheetId ?? "") ===
              filter.schematicSheetId),
      )
  }

  /** Counts emitted issue objects, including zero counts for known types. */
  getIssueCounts(filter: { schematicSheetId?: string } = {}) {
    const counts = {
      FlybackDiodeSeparatedFromRelayCoil: 0,
      ComponentOverlap: 0,
      SchematicBoxHasALotOfSurroundingWhitespace: 0,
      CapacitorSymbolHorizontal: 0,
      VerboseSchematicNetLabel: 0,
      PinHeaderSchematicBoxTooWide: 0,
      GenericSchematicBoxTooWide: 0,
      SchematicBoxInnerLabelCollision: 0,
      SchematicPinPaddingToEdgeTooLarge: 0,
      DiodeResistorNotAligned: 0,
      ComponentPinsWouldAlignWithVerticalShift: 0,
      TraceCanBeSimplifiedByMovingComponent: 0,
      CrystalNotCenteredOverLoadCapacitors: 0,
      ComponentNetLabelCollision: 0,
      ComponentBoxNetLabelCollision: 0,
      NetLabelCollision: 0,
      FeedbackNetworkNotCompact: 0,
      PullResistorOnWrongSide: 0,
      SchematicTextCollision: 0,
      ResetNetworkNotGrouped: 0,
      TwoPinComponentCouldBeFlipped: 0,
      TwoPinComponentShouldBeVertical: 0,
      TwoPinComponentHasInvertedRails: 0,
      TwoPinPullupPowerBelowSignal: 0,
      DecouplingCapacitorsNotCloseTogether: 0,
      ConnectorPositionCausesTraceDetours: 0,
      LowSideTransistorNotAlignedWithLoad: 0,
      UsbSeriesResistorsNotAligned: 0,
      RegulatorCapacitorsOnWrongSides: 0,
      VoltageDividerSupplyResistorBelowGroundResistor: 0,
      CurrentSenseShuntSeparatedFromInputs: 0,
      MosfetGateNetworkNotGrouped: 0,
    } satisfies Record<SchematicPlacementIssue["lineItemType"], number>
    for (const issue of this.getIssues(filter)) counts[issue.lineItemType]++
    return counts
  }

  getString(): string {
    return this.toString()
  }

  schematicBoxPlacementsToString(
    lineItem: SchematicBoxPlacementLineItem,
  ): string {
    const attrs: string[] = []
    addAttr(attrs, "componentName", lineItem.sourceComponentName)
    addAttr(attrs, "positionAnchor", lineItem.positionAnchor)
    addAttr(attrs, "schX", lineItem.schX)
    addAttr(attrs, "schY", lineItem.schY)
    addAttr(attrs, "width", lineItem.width)
    addAttr(attrs, "height", lineItem.height)
    return `<SchematicBoxPlacement ${attrs.join(" ")} />`
  }

  schematicIssuesToString(issue: SchematicPlacementIssue): string {
    switch (issue.lineItemType) {
      case "MosfetGateNetworkNotGrouped":
        return MosfetGateNetworkPlacementSolver.issueToString(issue)
      case "CurrentSenseShuntSeparatedFromInputs":
        return CurrentSenseShuntPlacementSolver.issueToString(issue)
      case "ComponentOverlap":
        return SchematicBoxOverlapSolver.issueToString(issue)
      case "CapacitorSymbolHorizontal":
        return CapacitorOrientationSolver.issueToString(issue)
      case "DecouplingCapacitorsNotCloseTogether":
        return DecouplingCapacitorGroupingSolver.issueToString(issue)
      case "VerboseSchematicNetLabel":
        return VerboseNetLabelSolver.issueToString(issue)
      case "PinHeaderSchematicBoxTooWide":
      case "GenericSchematicBoxTooWide":
        return SchematicBoxTooWideSolver.issueToString(issue)
      case "SchematicBoxInnerLabelCollision":
        return SchematicBoxInnerLabelCollisionSolver.issueToString(issue)
      case "SchematicPinPaddingToEdgeTooLarge":
        return SchematicPinPaddingToEdgeSolver.issueToString(issue)
      case "DiodeResistorNotAligned":
        return DiodeResistorAlignmentSolver.issueToString(issue)
      case "ComponentPinsWouldAlignWithVerticalShift":
        return ComponentPinAlignmentSolver.issueToString(issue)
      case "TraceCanBeSimplifiedByMovingComponent":
        return TraceSimplificationSolver.issueToString(issue)
      case "CrystalNotCenteredOverLoadCapacitors":
        return CrystalLoadCapacitorPlacementSolver.issueToString(issue)
      case "TwoPinComponentCouldBeFlipped":
        return TwoPinComponentOrientationSolver.issueToString(issue)
      case "FeedbackNetworkNotCompact":
        return FeedbackNetworkPlacementSolver.issueToString(issue)
      case "TwoPinComponentShouldBeVertical":
      case "TwoPinComponentHasInvertedRails":
      case "TwoPinPullupPowerBelowSignal":
        return TwoPinComponentRailOrientationSolver.issueToString(issue)
      case "PullResistorOnWrongSide":
        return PullResistorPlacementSolver.issueToString(issue)
      case "NetLabelCollision":
        return ComponentNetLabelCollisionSolver.netLabelCollisionToString(issue)
      case "SchematicTextCollision":
        return SchematicTextClearanceSolver.issueToString(issue)
      case "ResetNetworkNotGrouped":
        return ResetNetworkGroupingSolver.issueToString(issue)
      case "ConnectorPositionCausesTraceDetours":
        return ConnectorPlacementSolver.issueToString(issue)
      case "LowSideTransistorNotAlignedWithLoad":
        return LowSideTransistorPlacementSolver.issueToString(issue)
      case "FlybackDiodeSeparatedFromRelayCoil":
        return RelayFlybackDiodePlacementSolver.issueToString(issue)
      case "VoltageDividerSupplyResistorBelowGroundResistor":
        return VoltageDividerPlacementSolver.issueToString(issue)
      case "RegulatorCapacitorsOnWrongSides":
        return RegulatorInputOutputCapacitorPlacementSolver.issueToString(issue)
      case "UsbSeriesResistorsNotAligned":
        return UsbSeriesResistorPlacementSolver.issueToString(issue)
      default:
        return ""
    }
  }

  toString(): string {
    const schematicBoxPlacements = this.lineItems.filter(
      (lineItem): lineItem is SchematicBoxPlacementLineItem =>
        lineItem.lineItemType === "SchematicBoxPlacement",
    )
    const issues = this.lineItems.flatMap((lineItem) =>
      lineItem.lineItemType === "SchematicPlacementIssues"
        ? lineItem.issues
        : [],
    )
    if (issues.length === 0) return ""
    if (!this.groupBySchematicSheet) {
      return this.issueContextToLines(schematicBoxPlacements, issues).join("\n")
    }

    const groups = new Map<string, SchematicSheetGroup>()
    const getOrCreateGroup = (
      context: SchematicSheetContext,
    ): SchematicSheetGroup => {
      const key =
        context.schematicSheetId ?? context.schematicSheetName ?? "__default__"
      const existingGroup = groups.get(key)
      if (existingGroup) return existingGroup
      const group = { ...context, placements: [], issues: [] }
      groups.set(key, group)
      return group
    }

    for (const issue of issues) {
      getOrCreateGroup(getIssueSchematicSheetContext(issue)).issues.push(issue)
    }
    for (const placement of schematicBoxPlacements) {
      getOrCreateGroup({
        schematicSheetId: placement.schematicSheetId,
        schematicSheetName: placement.schematicSheetName,
      }).placements.push(placement)
    }

    return [...groups.values()]
      .flatMap((group) => {
        const sheetAttrs: string[] = []
        addAttr(sheetAttrs, "name", group.schematicSheetName)
        addAttr(sheetAttrs, "id", group.schematicSheetId)
        return [
          `<SchematicSheet${sheetAttrs.length > 0 ? ` ${sheetAttrs.join(" ")}` : ""}>`,
          ...this.issueContextToLines(group.placements, group.issues),
          "</SchematicSheet>",
        ]
      })
      .join("\n")
  }

  private issueContextToLines(
    placements: SchematicBoxPlacementLineItem[],
    issues: SchematicPlacementIssue[],
  ): string[] {
    return [
      ...(placements.length > 0
        ? [
            "<SchematicBoxPositions>",
            ...placements.map(this.schematicBoxPlacementsToString),
            "</SchematicBoxPositions>",
          ]
        : []),
      "<SchematicPlacementIssues>",
      ...issues.map(this.schematicIssuesToString),
      "</SchematicPlacementIssues>",
    ]
  }
}

export const analyzeSchematicPlacement = (
  circuitJson: CircuitJson,
  options: SchematicPlacementAnalysisOptions = {},
): SchematicPlacementAnalysis => {
  const pipeline = new SchematicPlacementPipeline(circuitJson, options)
  pipeline.solve()
  const { issues, componentPlacements } = pipeline.getOutput()

  const relevantPlacements = getRelevantPlacementsForIssues({
    issues,
    componentPlacements,
    circuitJson,
  })
  const lineItems: SchematicPlacementLineItem[] = [
    ...relevantPlacements,
    ...(issues.length > 0
      ? [{ lineItemType: "SchematicPlacementIssues" as const, issues }]
      : []),
  ]

  const schematicSheetIds = new Set(
    circuitJson.flatMap((element) =>
      "schematic_sheet_id" in element &&
      typeof element.schematic_sheet_id === "string"
        ? [element.schematic_sheet_id]
        : [],
    ),
  )
  return new SchematicPlacementAnalysis(lineItems, schematicSheetIds.size > 1)
}
