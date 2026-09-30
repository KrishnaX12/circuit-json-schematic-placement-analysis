import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { allwinnerT113CircuitJson } from "../assets/allwinner-t113"
import { analyzeSchematicPlacement } from "lib/index"
import { createPullupOrientationCircuit } from "../assets/declared-pullup-orientation"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
  getReproSourcePort,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"

const issueTypes = ["TwoPinPullupPowerBelowSignal"] as const
const pullupIssues = (circuitJson: CircuitJson) =>
  analyzeSchematicPlacement(circuitJson, {
    issueTypes: [...issueTypes],
  }).getIssues()

test("detects inverted declared pull-ups and preserves bus connectivity", async () => {
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
  const after = await createPullupOrientationCircuit({ schRotation: 90 })
  expect(pullupIssues(circuitJson)).toMatchObject([
    { schematicBox: { sourceComponentName: "R_SCL" }, deltaSchRotation: 180 },
    { schematicBox: { sourceComponentName: "R_SDA" }, deltaSchRotation: 180 },
  ])
  expect(pullupIssues(after)).toEqual([])
  expect(after.filter((e) => e.type.startsWith("source_"))).toEqual(
    circuitJson.filter((e) => e.type.startsWith("source_")),
  )
  for (const name of ["MASTER", "TCA9555"])
    expect(getReproSchematicComponent(after, name)).toEqual(
      getReproSchematicComponent(circuitJson, name),
    )
  for (const [variant, json] of [
    ["before", circuitJson],
    ["after", after],
  ] as const) {
    const analysis = analyzeSchematicPlacement(json)
    expect(analysis.getIssues()).toEqual(pullupIssues(json))
    expect(
      createIssueReproSnapshot({
        circuitJson: json,
        analysis,
        issueTypes: [...issueTypes],
        showFullSchematic: true,
        showOverlay: true,
        width: 1200,
        height: 550,
      }),
    ).toMatchSvgSnapshot(import.meta.path, variant)
  }
  for (const schRotation of [0, 180]) {
    const horizontal = await createPullupOrientationCircuit({ schRotation })
    expect(pullupIssues(horizontal)).toEqual([])
    expect(
      analyzeSchematicPlacement(horizontal).getIssues({
        issueTypes: ["TwoPinComponentShouldBeVertical"],
      }),
    ).toHaveLength(2)
  }
  const undeclared = await createPullupOrientationCircuit({
    declarePullRequirements: false,
  })
  expect(pullupIssues(undeclared)).toHaveLength(2)
  const unknown = structuredClone(undeclared)
  for (const e of unknown)
    if (e.type === "source_port") {
      e.name = `pin${e.pin_number}`
      e.port_hints = []
    }
  expect(pullupIssues(unknown)).toEqual([])
  const ambiguousRoles = structuredClone(undeclared)
  for (const host of ["MASTER", "TCA9555"]) {
    const scl = getReproSourcePort(ambiguousRoles, host, "SCL")
    scl.port_hints = [...(scl.port_hints ?? []), "SDA"]
  }
  expect(pullupIssues(ambiguousRoles)).toEqual([])
  const shortedBus = structuredClone(undeclared)
  shortedBus.push({
    type: "source_trace",
    source_trace_id: "shorted-bus",
    connected_source_port_ids: [
      getReproSourcePort(shortedBus, "MASTER", "SDA").source_port_id,
      getReproSourcePort(shortedBus, "MASTER", "SCL").source_port_id,
    ],
    connected_source_net_ids: [],
  })
  for (const e of shortedBus)
    if (
      e.type === "source_port" ||
      e.type === "source_net" ||
      e.type === "source_trace"
    )
      delete e.subcircuit_connectivity_map_key
  expect(pullupIssues(shortedBus)).toEqual([])
  // These real-board supply branches include feedback/sense resistors and
  // have no pull-up declarations. The new rule must not guess their roles.
  expect(pullupIssues(allwinnerT113CircuitJson)).toEqual([])

  const guards: Record<string, (json: CircuitJson) => void> = {
    "conflicting pull direction": (json) => {
      getReproSourcePort(json, "MASTER", "SCL").needs_external_pulldown = true
    },
    "missing declaration": (json) => {
      for (const host of ["MASTER", "TCA9555"]) {
        const port = getReproSourcePort(json, host, "SCL")
        port.needs_external_pullup = false
        port.name = "CLOCK"
        port.port_hints = []
      }
    },
    "disconnected requesting pins": (json) => {
      for (const host of ["MASTER", "TCA9555"])
        getReproSourcePort(json, host, "SCL").do_not_connect = true
    },
    "disconnected resistor": (json) => {
      getReproSourcePort(json, "R_SCL", "pin1").do_not_connect = true
    },
    "zero-ohm link": (json) => {
      for (const e of json)
        if (
          e.type === "source_component" &&
          e.name === "R_SCL" &&
          e.ftype === "simple_resistor"
        )
          e.resistance = 0
    },
    "ambiguous placement": (json) => {
      json.push({
        ...getReproSchematicComponent(json, "R_SCL"),
        schematic_component_id: "duplicate",
      })
    },
    "missing terminal geometry": (json) => {
      const id = getReproSourcePort(json, "R_SCL", "pin2").source_port_id
      json.splice(
        json.findIndex(
          (e) => e.type === "schematic_port" && e.source_port_id === id,
        ),
        1,
      )
    },
    "terminal on another sheet": (json) => {
      const id = getReproSourcePort(json, "R_SCL", "pin2").source_port_id
      for (const e of json)
        if (e.type === "schematic_port" && e.source_port_id === id)
          e.schematic_sheet_id = "other"
    },
  }
  for (const [name, mutate] of Object.entries(guards)) {
    const json = structuredClone(circuitJson)
    mutate(json)
    expect(pullupIssues(json), name).toMatchObject([
      { schematicBox: { sourceComponentName: "R_SDA" } },
    ])
  }
  const renamed = structuredClone(circuitJson)
  for (const e of renamed) {
    if (e.type === "source_component") e.name = `part_${e.source_component_id}`
    if (
      e.type === "source_port" ||
      e.type === "source_net" ||
      e.type === "source_trace"
    )
      delete e.subcircuit_connectivity_map_key
  }
  expect(pullupIssues(renamed)).toHaveLength(2)
  const singleDeclaration = structuredClone(circuitJson)
  for (const signal of ["SCL", "SDA"])
    getReproSourcePort(
      singleDeclaration,
      "MASTER",
      signal,
    ).needs_external_pullup = false
  expect(pullupIssues(singleDeclaration)).toHaveLength(2)
  const rounded = structuredClone(circuitJson)
  const powerId = getReproSourcePort(rounded, "R_SCL", "pin2").source_port_id
  for (const e of rounded)
    if (e.type === "schematic_port" && e.source_port_id === powerId)
      e.center.x += 0.005
  expect(pullupIssues(rounded)).toHaveLength(2)
  expect(JSON.stringify(circuitJson)).toBe(original)
})
