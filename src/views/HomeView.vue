<!-- eslint-disable vuejs-accessibility/label-has-for -->
<template>
  <!--eslint-disable vuejs-accessibility/no-autofocus-->
  <ProgressSpinner v-show="!properties.length" />
  <!--fix this derpy autocomplete. every second dropdown or so stalls-->
  <AutoComplete
    v-model="selectedProperty"
    :suggestions="visibleProperties"
    dropdown
    @complete="search"
    @item-select="getUnitCodes"
    v-show="properties.length"
    placeholder="Select a Property"
  />
  <Calendar v-model="date" showIcon />
  <spacer />
  <p v-show="!fetching && !unitCodes.length">
    No results found for property "{{selectedProperty}}" and date "{{getFormattedDate(date)}}"
  </p>
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
    <p style="display: flex; justify-content: left;">Results: {{visibleUnitCodes.length}}</p>
    <DataTable
      :value="visibleUnitCodes"
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
  <ProgressSpinner v-show="fetching" />

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Spacer from '@/components/Spacer.vue'
import AutoComplete from 'primevue/autocomplete'
import Calendar from 'primevue/calendar'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import ProgressSpinner from 'primevue/progressspinner'
import { listProperties, listUnitCodes } from '@/xhr'
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
  visibleProperties: string[]
  unitCodes: UnitCode[]
  columns: Col[]
  date?: Date
  visibleUnitCodes: UnitCode[]
  filter: string
  fetching: boolean
}
interface Obj {
  [key: string]: Obj | string | number | Obj[]
}

type LogObj = (label: string, obj: Obj | Obj[] | UnitCode) => void
const logObj: LogObj = (label, obj) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  console.log(JSON.parse(JSON.stringify(obj))) // eslint-disable-line no-console
}
export default defineComponent({
  name: `HomeView`,
  components: {
    AutoComplete,
    Calendar,
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
    visibleProperties: [],
    unitCodes: [],
    visibleUnitCodes: [],
    date: null,
    columns: [
      { field: `unit`, header: `Unit` },
      { field: `codes`, header: `Codes` },
      { field: `user`, header: `User` },
      { field: `createdAt`, header: `Date Serviced` },
      { field: `property`, header: `Property` },
    ],
    filter: `all`,
    fetching: false,
  }),
  watch: {
    filter(val) {
      this.visibleUnitCodes = filteredCodes(val, this.unitCodes)
    },
    async date(_) {
      this.getUnitCodes()
    },
  },
  async mounted() {
    this.properties = await listProperties()
  },
  methods: {
    onExport() {
      const formatedData = this.visibleUnitCodes.map((x: UnitCode) => [
        x.unit,
        x.codes,
        x.user,
        x.property,
        x.createdAt,
      ])
      handleCSVDownload([`Unit`, `Codes`, `User`, `Property`, `Date Serviced`], formatedData)
    },
    getFormattedDate(date: Date) {
      if (!date) return ``
      return format(date, `P`)
    },
    async getUnitCodes() {
      this.fetching = true
      const codes = await listUnitCodes(this.selectedProperty, this.date)
      const codesWithCSTTimezone = getCodesWithCSTTimezone(codes)
      this.unitCodes = codesWithCSTTimezone
      this.visibleUnitCodes = codesWithCSTTimezone
      this.visibleProperties = this.properties
      this.fetching = false;
    },
    search(evt) {
      if (!evt.query) {
        this.visibleProperties = this.properties
      } else {
        this.visibleProperties = this.properties.filter(
          (x) => x.toLowerCase().includes(evt.query.toLowerCase())
        )
      }
    },
  },
})

function getCodesWithCSTTimezone(codes: UnitCode[]) {
  return codes.map((code: UnitCode) => {
    if (code.createdAt) {
      const createdAt = format(new Date(code.createdAt), `Pp`)
      return {
        ...code,
        createdAt,
      }
    } return code
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
