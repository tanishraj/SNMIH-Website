export const getGeneratedPayloadInterface = (source: string, interfaceName: string): string => {
  const marker = `export interface ${interfaceName} {`
  const start = source.indexOf(marker)

  if (start === -1) {
    throw new Error(`Missing generated Payload interface: ${interfaceName}`)
  }

  const nextInterface = source.indexOf('\nexport interface ', start + marker.length)
  return source.slice(start, nextInterface === -1 ? source.length : nextInterface)
}
