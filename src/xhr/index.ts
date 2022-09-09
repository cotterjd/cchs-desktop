const url = process.env.VUE_APP_BE_URL

export const listProperties = () => fetch(`${url}/properties`).then(r => r.json())

export const updateUnitCode = (unitCode: any) => fetch(`${url}/unitcode/${unitCode.id}`, {
  method: `PUT`,
  body: JSON.stringify(unitCode),
  headers: {
    'Content-Type': `application/json`,
  },
}).then((r) => r.json())

export const deleteUnitCode = (id: string) => fetch(`${url}/unitcode/${id}`, {
  method: `DELETE`,
})

export const listUnitCodes = (job: string) => fetch(`${url}/unitcodes?job=${encodeURIComponent(job)}`)
  .then((r) => r.json())

export const saveUnitCodes = (deviceId: string, unitName: string, chosenCodes: string[], jobName: string) => fetch(`${url}/unitcode`, {
  method: `POST`,
  body: JSON.stringify({
    user: deviceId,
    unit: unitName,
    codes: chosenCodes.join(`, `),
    property: jobName,
  }),
  headers: {
    'Content-Type': `application/json`,
  },
}).then((r) => r.json())
