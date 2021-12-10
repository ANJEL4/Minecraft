/* eslint-env mocha */
// Tests packet serialization/deserialization from with raw binary from minecraft-packets
const { createSerializer, createDeserializer, states, supportedVersions } = require('minecraft-protocol')
const mcPackets = require('minecraft-packets')
const assert = require('assert')

const serializers = {}
const deserializers = {}
const makeClientSerializer = version => createSerializer({ state: states.PLAY, version, isServer: true })
const makeClientDeserializer = version => createDeserializer({ state: states.PLAY, version })

for (const mcVersion of supportedVersions) {
  describe(`Packet cycle tests for ${mcVersion}`, () => {
    if (!(mcVersion in mcPackets.pc)) {
      throw new Error(`${mcVersion} Version not in minecraft-packets`)
    }
    runTestForVersion(mcVersion)
  })
}

function cycleBufferFactory (mcVersion) {
  serializers[mcVersion] = serializers[mcVersion] ? serializers[mcVersion] : makeClientSerializer(mcVersion)
  deserializers[mcVersion] = deserializers[mcVersion] ? serializers[mcVersion] : makeClientDeserializer(mcVersion)
  const bufferToParsed = b => deserializers[mcVersion].parsePacketBuffer(b).data
  const parsedToBuffer = obj => serializers[mcVersion].createPacketBuffer(obj)
  return buffer => parsedToBuffer(bufferToParsed(buffer))
}

function runTestForVersion (mcVersion) {
  const cycleBuffer = cycleBufferFactory(mcVersion)
  function testBuffer (buffer, [packetName, packetIx]) {
    const cycled = cycleBuffer(buffer)
    assert.strictEqual(buffer.equals(cycled), true, `Error when testing ${+packetIx + 1} ${packetName} packet`)
  }
  // server -> client
  const data = mcPackets.pc[mcVersion]['from-server']
  for (const [packetName, packetData] of Object.entries(data)) {
    it(`${packetName} packet`, () => {
      for (const i in packetData) {
        testBuffer(packetData[i].raw, [packetName, i])
      }
    })
  }
}