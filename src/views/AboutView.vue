<template>
  <div class="about">
    <h1>version {{version}}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const packageJson = require('../../package.json')

export default defineComponent({
  name: `AboutView`,
  data: () => ({
    version: packageJson.version,
  }),
})
</script>
