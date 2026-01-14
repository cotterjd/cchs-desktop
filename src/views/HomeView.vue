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
  <!-- this dropdown should be by filter buttons
    which are clientside, the other inputs up here are serverside-->
  <Dropdown
    v-model="user"
    :options="users"
    placeholder="Select a tech"
    @change="onChangeUser"
  />
  <spacer />
  <p v-show="!fetching && !unitCodes.length">
    No results found for property "{{selectedProperty}}" and date "{{getFormattedDate(date)}}"
  </p>
  <p v-show="!fetching && !unitCodes.length && !date && user">
    Please select a date to see results
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
        <radio-button name="filter" value="no issues" v-model="filter" /> Completed no issues
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
        sortable
        :key="col.field"
        style="width:25%"
      />
      <Column header="Image" style="width:10%">
        <template #body="slotProps">
          <i
            v-if="slotProps.data.image"
            class="pi pi-image"
            style="font-size: 1.5rem; cursor: pointer; color: #6366f1;"
            @click="viewImage(slotProps.data.image)"
            title="View Image"
          />
        </template>
      </Column>
      <!-- <template #editor="{ data, field }">
            <InputText
              v-model="data[field]"
              autofocus
            />
        </template>
      </Column>-->
    </DataTable>
    <Dialog
      v-model:visible="imageDialogVisible"
      header="Unit Image"
      :modal="true"
      :style="{width: '50vw'}"
    >
      <img
        v-if="currentImage"
        :src="currentImage"
        alt="Unit image"
        style="width: 100%; height: auto;"
      />
    </Dialog>
  </div>
  <ProgressSpinner v-show="fetching" />

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Spacer from '@/components/Spacer.vue'
import AutoComplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
// import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import { listProperties, listUnitCodes, listUsers } from '@/xhr'
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
  users: any[]
  user: string
  imageDialogVisible: boolean
  currentImage: string
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
    // InputText,
    DataTable,
    Dropdown,
    Column,
    Button,
    ProgressSpinner,
    Spacer,
    RadioButton,
    Dialog,
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
    users: [],
    user: ``,
    imageDialogVisible: false,
    currentImage: ``,
  }),
  watch: {
    filter(val) {
      this.visibleUnitCodes = filteredCodes(val, this.unitCodes, this.user)
    },
    imageDialogVisible(val) {
      if (!val) {
        this.currentImage = ``
      }
    },
    async date(_) {
      this.getUnitCodes()
    },
  },
  async mounted() {
    this.properties = await listProperties()
    const users = await listUsers()
    this.users = [``, ...users] // add option to de-select
    // this.visibleUnitCodes = this.visibleUnitCodes.filter(vuc => )
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
    onChangeUser() {
      this.getUnitCodes()
    },
    getFormattedDate(date: Date) {
      if (!date) return ``
      return format(date, `P`)
    },
    async getUnitCodes() {
      this.fetching = true
      const codes = await listUnitCodes(this.selectedProperty, this.date, this.user)
      const codesWithCSTTimezone = getCodesWithCSTTimezone(codes)
      this.unitCodes = codesWithCSTTimezone
      this.visibleUnitCodes = codesWithCSTTimezone
      if (this.user) {
        this.visibleUnitCodes = this.visibleUnitCodes.filter(code => code.user === this.user)
      }
      this.visibleProperties = this.properties
      this.fetching = false
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
    viewImage(imageData: any) {
      const uint8 = new Uint8Array(imageData.data)
      let binary = ``
      const len = uint8.byteLength
      for (let i = 0; i < len; i += 1) {
        binary += String.fromCharCode(uint8[i])
      }
      const base64 = window.btoa(binary)
      this.currentImage = `data:image/jpeg;base64,${base64}`
      this.imageDialogVisible = true
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
