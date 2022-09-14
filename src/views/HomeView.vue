<!-- eslint-disable vuejs-accessibility/label-has-for -->
<template>
  <!--eslint-disable vuejs-accessibility/no-autofocus-->
  <ProgressSpinner v-show="!properties.length" />
  <Dropdown
    v-model="selectedProperty"
    :options="properties"
    v-show="properties.length"
    placeholder="Select a Property"
  />
  <spacer />

  <div v-show="unitCodes.length">
    <div class="btn-container">
      <label for="all-filter">
        <radio-button id="all-filter" name="filter" value="all" v-model="filter" />
        All
      </label>
      <label for="incomplete-filter">
        <radio-button id="incomplete-filter" name="filter" value="incomplete" v-model="filter" />
        Incomplete
      </label>
      <label for="issues-filter">
        <radio-button
          id="issues-filter"
          name="filter"
          value="issues"
          v-model="filter"
        />
        Completed with issues
      </label>
      <label for="good-filter">
        <radio-button name="filter" value="no issues" v-model="filter" />
        Completed no issues
      </label>
      <Button
        label="Export"
        @click="onExport"
        class="p-button-link"
      />
    </div>
    <spacer />
    <DataTable
      :value="visibleUnitCodes"
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
import Spacer from '@/components/Spacer.vue'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import ProgressSpinner from 'primevue/progressspinner'
import { listProperties, listUnitCodes, updateUnitCode } from '@/xhr'
import handleCSVDownload from '@/utils/export'
import filteredCodes from '@/utils/filteredCodes'
import { UnitCode } from '@/types'
import { format } from 'date-fns'

interface Col {
  field: string
  header: string
}
interface Data {
  selectedProperty: string
  properties: string[]
  unitCodes: UnitCode[]
  columns: Col[]
  visibleUnitCodes: UnitCode[]
  filter: string
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
    Spacer,
    RadioButton,
  },
  data: ():Data => ({
    selectedProperty: ``,
    properties: [],
    unitCodes: [],
    visibleUnitCodes: [],
    columns: [
      { field: `unit`, header: `Unit` },
      { field: `codes`, header: `Codes` },
      { field: `user`, header: `User` },
      { field: `createdAt`, header: `Date Serviced` },
    ],
    filter: `all`,
  }),
  watch: {
    async selectedProperty(_) {
      const codes = await this.getUnitCodes()
      const codesWithCSTTimezone = getCodesWithCSTTimezone(codes)
      this.unitCodes = codesWithCSTTimezone
      this.visibleUnitCodes = codesWithCSTTimezone
    },
    filter(val) {
      this.visibleUnitCodes = filteredCodes(val, this.unitCodes)
    },
  },
  async mounted() {
    this.properties = await listProperties()
  },
  methods: {
    async onCellEditComplete(cell: any) {
      const updatedUnitCode = await updateUnitCode(cell.newData)
      // TODO: test edit when filtered
      this.unitCodes = this.unitCodes.map(
        (unitCode: UnitCode): UnitCode => (unitCode.id === updatedUnitCode.id
          ? updatedUnitCode
          : unitCode),
      )
    },
    onExport() {
      const formatedData = this.visibleUnitCodes
        .map((x: UnitCode) => [x.unit, x.codes, x.user, x.property])
      handleCSVDownload([`Unit`, `Codes`, `User`, `Property`], formatedData)
    },
    getUnitCodes() {
      return listUnitCodes(this.selectedProperty)
    },
  },
})

function getCodesWithCSTTimezone(codes: UnitCode[]) {
  return codes.map((code: UnitCode) => {
    try {
      const createdAt = format(new Date(code.createdAt), `Pp`)
      return {
        ...code,
        createdAt,
      }
    } catch (e) {
      return code
    }
  })
}
</script>
<style>
  .btn-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
</style>
