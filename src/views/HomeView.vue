<template>
  <!--eslint-disable vuejs-accessibility/no-autofocus-->
  <ProgressSpinner v-show="!properties.length" />
  <Dropdown
    v-model="selectedProperty"
    :options="properties"
    v-show="properties.length"
    placeholder="Select a Property"
  />

  <div v-show="unitCodes.length">
    <Button v-show="unitCodes.length" label="export" @click="onExport" />
    <DataTable
      v-show="unitCodes.length"
      :value="unitCodes"
      editMode="cell"
      @cell-edit-complete="onCellEditComplete"
      class="editable-cells-table"
      responsiveLayout="scroll"
    >
      <Column
        v-for="col of columns"
        :field="col.field"
        :header="col.header"
        :key="col.field"
        style="width:25%"
      >
        <template #editor="{ data, field }">
            <InputText
              v-model="data[field]"
              autofocus
            />
        </template>
      </Column>
    </DataTable>
  </div>
  <ProgressSpinner v-show="selectedProperty && !unitCodes.length" />

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { listProperties, listUnitCodes, updateUnitCode } from '@/xhr'
import handleCSVDownload from '@/utils/export'

interface UnitCode {
  id: string
  unit: string
  property: string
  user: string
  codes: string
}
interface Col {
  field: string
  header: string
}
interface Data {
  selectedProperty: string
  properties: string[]
  unitCodes: UnitCode[]
  columns: Col[]
}
interface Obj {
  [key: string]: Obj | string | number | Obj[]
}
const logObj = (label: string, obj: Obj | Obj[] | UnitCode) => {
  console.log(JSON.parse(JSON.stringify(obj))) // eslint-disable-line no-console
}
export default defineComponent({
  name: `HomeView`,
  components: {
    Dropdown,
    InputText,
    DataTable,
    Column,
    Button,
    ProgressSpinner,
  },
  data: ():Data => ({
    selectedProperty: ``,
    properties: [],
    unitCodes: [],
    columns: [
      { field: `unit`, header: `Unit` },
      { field: `codes`, header: `Codes` },
    ],
  }),
  watch: {
    async selectedProperty(_) {
      this.unitCodes = await this.getUnitCodes()
    },
  },
  async mounted() {
    this.properties = await listProperties()
  },
  methods: {
    async onCellEditComplete(cell: any) {
      const updatedUnitCode = await updateUnitCode(cell.newData)
      this.unitCodes = this.unitCodes.map(
        (unitCode: UnitCode): UnitCode => (unitCode.id === updatedUnitCode.id
          ? updatedUnitCode
          : unitCode),
      )
    },
    onExport() {
      const formatedData = this.unitCodes
        .map((x: UnitCode) => [x.unit, x.codes, x.user, x.property])
      handleCSVDownload([`Unit`, `Codes`, `User`, `Property`], formatedData)
    },
    getUnitCodes() {
      return listUnitCodes(this.selectedProperty)
    },
  },
})
</script>
