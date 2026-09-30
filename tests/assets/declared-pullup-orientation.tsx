import { Circuit } from "@tscircuit/core"

// Focused I2C bus fragment, based on TI TCA9555 Figure 34 (page 25).
// https://www.ti.com/lit/ds/symlink/tca9555.pdf#page=25
// Other device pins and application circuitry are intentionally omitted.
export async function createPullupOrientationCircuit({
  schRotation = 270,
  declarePullRequirements = true,
}: {
  schRotation?: number
  declarePullRequirements?: boolean
} = {}) {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(
    <board schTraceAutoLabelEnabled={false} schMaxTraceDistance={8}>
      <net name="V5" isPowerNet />
      <net name="GND" isGroundNet />
      <chip
        name="MASTER"
        schX={-5}
        schY={-1}
        pinLabels={{ pin1: "SCL", pin2: "SDA", pin3: "VCC", pin4: "GND" }}
        pinAttributes={{
          SCL: { needsExternalPullup: declarePullRequirements },
          SDA: { needsExternalPullup: declarePullRequirements },
        }}
        schPinArrangement={{
          leftSide: { pins: ["pin3", "pin4"], direction: "top-to-bottom" },
          rightSide: { pins: ["pin1", "pin2"], direction: "top-to-bottom" },
        }}
      />
      <chip
        name="TCA9555"
        schX={5}
        schY={-1}
        pinLabels={{ pin22: "SCL", pin23: "SDA", pin24: "VCC", pin12: "GND" }}
        pinAttributes={{
          SCL: { needsExternalPullup: declarePullRequirements },
          SDA: { needsExternalPullup: declarePullRequirements },
        }}
        schPinArrangement={{
          leftSide: { pins: ["pin22", "pin23"], direction: "top-to-bottom" },
          rightSide: { pins: ["pin24", "pin12"], direction: "top-to-bottom" },
        }}
      />
      <resistor
        name="R_SCL"
        resistance="10k"
        schX={-1}
        schY={3.5}
        schRotation={schRotation}
      />
      <resistor
        name="R_SDA"
        resistance="10k"
        schX={2}
        schY={3.5}
        schRotation={schRotation}
      />
      <trace name="I2C_SCL" from=".MASTER > .SCL" to=".TCA9555 > .SCL" />
      <trace name="I2C_SDA" from=".MASTER > .SDA" to=".TCA9555 > .SDA" />
      <trace name="SCL_PULLUP" from=".R_SCL > .pin1" to=".TCA9555 > .SCL" />
      <trace name="SDA_PULLUP" from=".R_SDA > .pin1" to=".TCA9555 > .SDA" />
      <trace name="SCL_PULLUP_POWER" from=".R_SCL > .pin2" to="net.V5" />
      <trace name="SDA_PULLUP_POWER" from=".R_SDA > .pin2" to="net.V5" />
      <trace name="MASTER_POWER" from=".MASTER > .VCC" to="net.V5" />
      <trace name="EXPANDER_POWER" from=".TCA9555 > .VCC" to="net.V5" />
      <trace name="MASTER_GROUND" from=".MASTER > .GND" to="net.GND" />
      <trace name="EXPANDER_GROUND" from=".TCA9555 > .GND" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
