import { noIssueCodes, issueCodes, incompleteCodes } from '@/static'
import { UnitCode } from '@/types'

export default (filterType: string, unitCodes: UnitCode[], user: string): UnitCode[] => {
  let codes = unitCodes
  if (filterType === `no issues`) codes = filterCodes(unitCodes, noIssueCodes)
  if (filterType === `issues`) codes = filterCodes(unitCodes, issueCodes)
  if (filterType === `incomplete`) codes = filterCodes(unitCodes, incompleteCodes)

  if (user) {
    return codes.filter(code => code.user === user)
  }

  return codes
}

// Won't handle multiple codes
function filterCodes(allCodes: UnitCode[], codes: string[]): UnitCode[] {
  return allCodes.filter((x: UnitCode) => {
    const nonWentBackEntry: string[] = x.codes.split(`, `).filter((str: string) => str !== `Went Back`)
    return codes.find(code => nonWentBackEntry[0].includes(code))
  })
}
