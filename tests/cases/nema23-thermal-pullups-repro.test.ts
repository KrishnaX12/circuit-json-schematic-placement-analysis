import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { nema23ThermalPullups as circuitJson } from "../assets/nema23-thermal-pullups"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
  getReproSourcePort,
} from "../fixtures/placement-repro-assertions"

test("records inverted I2C pull-ups on the published NEMA23 thermal sheet", () => {
  const original = JSON.stringify(circuitJson)
  expectReproRendered(circuitJson, 91)
  expectReproNets(circuitJson, [
    ["R_SDA.pin1", "U_TEMP.SDA", "net.TEMP_SDA"],
    ["R_SCL.pin1", "U_TEMP.SCL", "net.TEMP_SCL"],
    ["R_SDA.pin2", "R_SCL.pin2", "U_TEMP.V_POS", "net.V3V3"],
  ])
  for (const name of ["R_SDA", "R_SCL"]) {
    const powerId = getReproSourcePort(circuitJson, name, "pin2").source_port_id
    const signalId = getReproSourcePort(
      circuitJson,
      name,
      "pin1",
    ).source_port_id
    const power = circuitJson.find(
      (e) => e.type === "schematic_port" && e.source_port_id === powerId,
    )
    const signal = circuitJson.find(
      (e) => e.type === "schematic_port" && e.source_port_id === signalId,
    )
    if (power?.type !== "schematic_port" || signal?.type !== "schematic_port")
      throw new Error(`Missing ports for ${name}`)
    expect(power.center.x).toBeCloseTo(signal.center.x)
    expect(power.center.y).toBeLessThan(signal.center.y)
  }
  const issueTypes = [
    "TwoPinComponentShouldBeVertical",
    "TwoPinComponentHasInvertedRails",
  ] as const
  const analysis = analyzeSchematicPlacement(circuitJson)
  const orientation = analysis.getIssues({ issueTypes })
  expect(
    orientation.some(
      (issue) =>
        (issue.lineItemType === "TwoPinComponentShouldBeVertical" ||
          issue.lineItemType === "TwoPinComponentHasInvertedRails") &&
        ["R_SDA", "R_SCL"].includes(
          issue.schematicBox.sourceComponentName ?? "",
        ),
    ),
  ).toBe(false)
  expect(
    createIssueReproSnapshot({
      circuitJson,
      analysis,
      issueTypes,
      schematicSheetId: "schematic_sheet_4",
      showFullSchematic: true,
      showOverlay: false,
      width: 1500,
      height: 850,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
  expect(JSON.stringify(circuitJson)).toBe(original)
})
