import { beforeAll, expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import rp2040MotorControllerCircuitJson from "../assets/rp2040-motor-controller.circuit.json"
import { createIssueOverlaySvg } from "../fixtures/create-issue-overlay-svg"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

let defaultSvgRoot = ""

beforeAll(() => {
  const circuitJson = rp2040MotorControllerCircuitJson as CircuitJson
  const sheet = circuitJson.find(
    (element) =>
      element.type === "schematic_sheet" && element.name === "motor_power",
  )
  if (sheet?.type !== "schematic_sheet")
    throw new Error("Missing motor_power sheet")

  const analysis = analyzeSchematicPlacement(circuitJson)
  const input = {
    circuitJson,
    analysis,
    schematicSheetId: sheet.schematic_sheet_id,
  }
  expect(analysis.getIssues(input).length).toBeGreaterThan(0)
  defaultSvgRoot =
    createIssueOverlaySvg(input).match(/^<svg\b[^>]*>/)?.[0] ?? ""
  const fullSvgRoot = createIssueOverlaySvg({
    ...input,
    showFullSchematic: true,
  }).match(/^<svg\b[^>]*>/)?.[0]
  expect(defaultSvgRoot).toContain("viewBox=")
  expect(fullSvgRoot).toBeDefined()
  expect(fullSvgRoot).not.toContain("viewBox=")

  expect(createIssueReproSnapshot(input)).toMatchSvgSnapshot(
    import.meta.path,
    "cropped",
  )
  expect(
    createIssueReproSnapshot({ ...input, showFullSchematic: true }),
  ).toMatchSvgSnapshot(import.meta.path, "full")
})

test.failing("shows the complete RP2040 motor power sheet by default", () => {
  expect(defaultSvgRoot).not.toContain("viewBox=")
})
