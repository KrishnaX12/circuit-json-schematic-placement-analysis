import { MosfetGateNetworkPlacementSolver } from "../MosfetGateNetworkPlacementSolver/MosfetGateNetworkPlacementSolver"
import { RelayFlybackDiodePlacementSolver } from "../RelayFlybackDiodePlacementSolver/RelayFlybackDiodePlacementSolver"
import { CurrentSenseShuntPlacementSolver } from "../CurrentSenseShuntPlacementSolver/CurrentSenseShuntPlacementSolver"
import { VoltageDividerPlacementSolver } from "../VoltageDividerPlacementSolver/VoltageDividerPlacementSolver"
import { RegulatorInputOutputCapacitorPlacementSolver } from "../RegulatorInputOutputCapacitorPlacementSolver/RegulatorInputOutputCapacitorPlacementSolver"
import { ConnectorPlacementSolver } from "../ConnectorPlacementSolver/ConnectorPlacementSolver"
import { LowSideTransistorPlacementSolver } from "../LowSideTransistorPlacementSolver/LowSideTransistorPlacementSolver"
import { UsbSeriesResistorPlacementSolver } from "../UsbSeriesResistorPlacementSolver/UsbSeriesResistorPlacementSolver"
import {
  BasePipelineSolver,
  definePipelineStep,
  type PipelineStep,
} from "@tscircuit/solver-utils"
import type { CircuitJson } from "circuit-json"
import type {
  SchematicPlacementIssue,
  SchematicPlacementAnalysisOptions,
} from "../../types"
import { buildSolverContext } from "../../utils/placements"
import { CapacitorOrientationSolver } from "../CapacitorOrientationSolver/CapacitorOrientationSolver"
import { DecouplingCapacitorGroupingSolver } from "../DecouplingCapacitorGroupingSolver/DecouplingCapacitorGroupingSolver"
import { ComponentNetLabelCollisionSolver } from "../ComponentNetLabelCollisionSolver/ComponentNetLabelCollisionSolver"
import { ComponentPinAlignmentSolver } from "../ComponentPinAlignmentSolver/ComponentPinAlignmentSolver"
import { CrystalLoadCapacitorPlacementSolver } from "../CrystalLoadCapacitorPlacementSolver/CrystalLoadCapacitorPlacementSolver"
import { DiodeResistorAlignmentSolver } from "../DiodeResistorAlignmentSolver/DiodeResistorAlignmentSolver"
import { FeedbackNetworkPlacementSolver } from "../FeedbackNetworkPlacementSolver/FeedbackNetworkPlacementSolver"
import { PullResistorPlacementSolver } from "../PullResistorPlacementSolver/PullResistorPlacementSolver"
import { TwoPinComponentRailOrientationSolver } from "../TwoPinComponentRailOrientationSolver/TwoPinComponentRailOrientationSolver"
import { SchematicBoxInnerLabelCollisionSolver } from "../SchematicBoxInnerLabelCollisionSolver/SchematicBoxInnerLabelCollisionSolver"
import { SchematicBoxOverlapSolver } from "../SchematicBoxOverlapSolver/SchematicBoxOverlapSolver"
import { SchematicBoxTooWideSolver } from "../SchematicBoxTooWideSolver/SchematicBoxTooWideSolver"
import { SchematicPinPaddingToEdgeSolver } from "../SchematicPinPaddingToEdgeSolver/SchematicPinPaddingToEdgeSolver"
import type { SolverContext } from "../SolverContext"
import { TraceSimplificationSolver } from "../TraceSimplificationSolver/TraceSimplificationSolver"
import { TwoPinComponentOrientationSolver } from "../TwoPinComponentOrientationSolver/TwoPinComponentOrientationSolver"
import { VerboseNetLabelSolver } from "../VerboseNetLabelSolver/VerboseNetLabelSolver"
import { SchematicTextClearanceSolver } from "../SchematicTextClearanceSolver/SchematicTextClearanceSolver"
import { ResetNetworkGroupingSolver } from "../ResetNetworkGroupingSolver/ResetNetworkGroupingSolver"

type SolverParams = { ctx: SolverContext; issues: SchematicPlacementIssue[] }

// Include prerequisites used when deduplicating findings in getOutput().
const solversByIssueType = {
  MosfetGateNetworkNotGrouped: [MosfetGateNetworkPlacementSolver],
  FlybackDiodeSeparatedFromRelayCoil: [RelayFlybackDiodePlacementSolver],
  ComponentOverlap: [SchematicBoxOverlapSolver],
  // Retained in the issue union, but no solver currently emits this type.
  SchematicBoxHasALotOfSurroundingWhitespace: [],
  CapacitorSymbolHorizontal: [
    CapacitorOrientationSolver,
    TwoPinComponentRailOrientationSolver,
  ],
  VerboseSchematicNetLabel: [VerboseNetLabelSolver],
  PinHeaderSchematicBoxTooWide: [SchematicBoxTooWideSolver],
  GenericSchematicBoxTooWide: [SchematicBoxTooWideSolver],
  SchematicBoxInnerLabelCollision: [SchematicBoxInnerLabelCollisionSolver],
  SchematicPinPaddingToEdgeTooLarge: [SchematicPinPaddingToEdgeSolver],
  DiodeResistorNotAligned: [DiodeResistorAlignmentSolver],
  ComponentPinsWouldAlignWithVerticalShift: [ComponentPinAlignmentSolver],
  TraceCanBeSimplifiedByMovingComponent: [TraceSimplificationSolver],
  CrystalNotCenteredOverLoadCapacitors: [CrystalLoadCapacitorPlacementSolver],
  ComponentNetLabelCollision: [ComponentNetLabelCollisionSolver],
  ComponentBoxNetLabelCollision: [ComponentNetLabelCollisionSolver],
  NetLabelCollision: [ComponentNetLabelCollisionSolver],
  FeedbackNetworkNotCompact: [FeedbackNetworkPlacementSolver],
  PullResistorOnWrongSide: [PullResistorPlacementSolver],
  SchematicTextCollision: [SchematicTextClearanceSolver],
  ResetNetworkNotGrouped: [ResetNetworkGroupingSolver],
  TwoPinComponentCouldBeFlipped: [TwoPinComponentOrientationSolver],
  TwoPinComponentShouldBeVertical: [TwoPinComponentRailOrientationSolver],
  TwoPinComponentHasInvertedRails: [TwoPinComponentRailOrientationSolver],
  TwoPinPullupPowerBelowSignal: [TwoPinComponentRailOrientationSolver],
  DecouplingCapacitorsNotCloseTogether: [DecouplingCapacitorGroupingSolver],
  ConnectorPositionCausesTraceDetours: [ConnectorPlacementSolver],
  LowSideTransistorNotAlignedWithLoad: [LowSideTransistorPlacementSolver],
  UsbSeriesResistorsNotAligned: [UsbSeriesResistorPlacementSolver],
  CurrentSenseShuntSeparatedFromInputs: [CurrentSenseShuntPlacementSolver],
  VoltageDividerSupplyResistorBelowGroundResistor: [
    VoltageDividerPlacementSolver,
  ],
  RegulatorCapacitorsOnWrongSides: [
    RegulatorInputOutputCapacitorPlacementSolver,
  ],
} satisfies Record<
  SchematicPlacementIssue["lineItemType"],
  readonly PipelineStep<any>["solverClass"][]
>

export class SchematicPlacementPipeline extends BasePipelineSolver<CircuitJson> {
  ctx!: SolverContext
  readonly issues: SchematicPlacementIssue[] = []

  pipelineDef: PipelineStep<any>[] = [
    definePipelineStep(
      "SchematicTextClearanceSolver",
      SchematicTextClearanceSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ResetNetworkGroupingSolver",
      ResetNetworkGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxOverlapSolver",
      SchematicBoxOverlapSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CapacitorOrientationSolver",
      CapacitorOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "VerboseNetLabelSolver",
      VerboseNetLabelSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxTooWideSolver",
      SchematicBoxTooWideSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicPinPaddingToEdgeSolver",
      SchematicPinPaddingToEdgeSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxInnerLabelCollisionSolver",
      SchematicBoxInnerLabelCollisionSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "DiodeResistorAlignmentSolver",
      DiodeResistorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ComponentPinAlignmentSolver",
      ComponentPinAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TraceSimplificationSolver",
      TraceSimplificationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CrystalLoadCapacitorPlacementSolver",
      CrystalLoadCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TwoPinComponentOrientationSolver",
      TwoPinComponentOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "FeedbackNetworkPlacementSolver",
      FeedbackNetworkPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TwoPinComponentRailOrientationSolver",
      TwoPinComponentRailOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "PullResistorPlacementSolver",
      PullResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ComponentNetLabelCollisionSolver",
      ComponentNetLabelCollisionSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "DecouplingCapacitorGroupingSolver",
      DecouplingCapacitorGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ConnectorPlacementSolver",
      ConnectorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "LowSideTransistorPlacementSolver",
      LowSideTransistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "UsbSeriesResistorPlacementSolver",
      UsbSeriesResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RegulatorInputOutputCapacitorPlacementSolver",
      RegulatorInputOutputCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "VoltageDividerPlacementSolver",
      VoltageDividerPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CurrentSenseShuntPlacementSolver",
      CurrentSenseShuntPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RelayFlybackDiodePlacementSolver",
      RelayFlybackDiodePlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "MosfetGateNetworkPlacementSolver",
      MosfetGateNetworkPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
  ]

  private readonly selectedIssueTypes?: Set<
    SchematicPlacementIssue["lineItemType"]
  >

  constructor(
    circuitJson: CircuitJson,
    options: SchematicPlacementAnalysisOptions = {},
  ) {
    super(circuitJson)
    if (options.issueTypes !== undefined) {
      this.selectedIssueTypes = new Set(options.issueTypes)
      const selectedSolvers = new Set<PipelineStep<any>["solverClass"]>(
        options.issueTypes.flatMap<PipelineStep<any>["solverClass"]>(
          (type) => solversByIssueType[type],
        ),
      )
      this.pipelineDef = this.pipelineDef.filter((step) =>
        selectedSolvers.has(step.solverClass),
      )
    }
  }

  override _setup(): void {
    this.ctx = buildSolverContext(this.inputProblem)
  }

  override getOutput() {
    // Prefer the rail-aware rotation over a duplicate generic capacitor warning.
    // The capacitor solver still reports horizontal capacitors outside this rule.
    const railOrientationComponentIds = new Set(
      this.issues.flatMap((issue) =>
        issue.lineItemType === "TwoPinComponentShouldBeVertical" &&
        issue.schematicBox.schematicComponentId
          ? [issue.schematicBox.schematicComponentId]
          : [],
      ),
    )
    return {
      issues: this.issues
        .filter(
          (issue) =>
            issue.lineItemType !== "CapacitorSymbolHorizontal" ||
            !railOrientationComponentIds.has(
              issue.schematicBox.schematicComponentId ?? "",
            ),
        )
        .filter(
          (issue) =>
            this.selectedIssueTypes === undefined ||
            this.selectedIssueTypes.has(issue.lineItemType),
        ),
      componentPlacements: this.ctx.componentPlacements,
    }
  }
}
