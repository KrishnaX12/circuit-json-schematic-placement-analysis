import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createPullupOrientationCircuit } from "../assets/declared-pullup-orientation"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
  getReproSourcePort,
} from "../fixtures/placement-repro-assertions"

test("records missed upside-down pull-ups on a declared I2C bus", async () => {
  const circuitJson = await createPullupOrientationCircuit()
  const original = JSON.stringify(circuitJson)
  expectReproRendered(circuitJson, 4)
  expectReproNets(circuitJson, [
    ["MASTER.SCL", "TCA9555.SCL", "R_SCL.pin1"],
    ["MASTER.SDA", "TCA9555.SDA", "R_SDA.pin1"],
    ["MASTER.VCC", "TCA9555.VCC", "R_SCL.pin2", "R_SDA.pin2", "net.V5"],
    ["MASTER.GND", "TCA9555.GND", "net.GND"],
  ])
  for (const signal of ["SCL", "SDA"]) {
    expect(
      getReproSourcePort(circuitJson, "TCA9555", signal).needs_external_pullup,
    ).toBe(true)
    const powerId = getReproSourcePort(
      circuitJson,
      `R_${signal}`,
      "pin2",
    ).source_port_id
    const signalId = getReproSourcePort(
      circuitJson,
      `R_${signal}`,
      "pin1",
    ).source_port_id
    const power = circuitJson.find(
      (e) => e.type === "schematic_port" && e.source_port_id === powerId,
    )
    const pin = circuitJson.find(
      (e) => e.type === "schematic_port" && e.source_port_id === signalId,
    )
    if (power?.type !== "schematic_port" || pin?.type !== "schematic_port")
      throw new Error("Missing resistor terminal geometry")
    expect(power.center.x).toBeCloseTo(pin.center.x)
    expect(power.center.y).toBeLessThan(pin.center.y)
  }
  const analysis = analyzeSchematicPlacement(circuitJson)
  expect(analysis.getIssues()).toEqual([])
  expect(
    createIssueReproSnapshot({
      circuitJson,
      analysis,
      showFullSchematic: true,
      width: 1200,
      height: 550,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "before")
  expect(JSON.stringify(circuitJson)).toBe(original)
})
