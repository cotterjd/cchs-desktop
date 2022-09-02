import { noIssueCodes, issueCodes, incompleteCodes } from '@/static'
import { UnitCode } from '@/types'

export default (filterType: string, unitCodes: UnitCode[]): UnitCode[] => {
  if (filterType === `no issues`) return filterCodes(unitCodes, noIssueCodes)
  if (filterType === `issues`) return filterCodes(unitCodes, issueCodes)
  if (filterType === `incomplete`) return filterCodes(unitCodes, incompleteCodes)
  return unitCodes
}

// Won't handle multiple codes
function filterCodes(allCodes: UnitCode[], codes: string[]): UnitCode[] {
  return allCodes.filter((x: UnitCode) => codes.includes(x.codes))
}
