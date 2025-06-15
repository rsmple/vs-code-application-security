<template>
  <div>
    <pre>
      {{ value }}
    </pre>

    123ывс
    <WInput />

    <WTabs>
      <WTabsItem
        name="1"
        title="Tab 1"
      >
        1
      </WTabsItem>
      <WTabsItem
        name="2"
        title="Tab 2"
      >
        1
      </WTabsItem>
    </WTabs>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'

import WInput from 'eco-vue-js/dist/components/Input/WInput.vue'
import WTabs from 'eco-vue-js/dist/components/Tabs/WTabs.vue'
import WTabsItem from 'eco-vue-js/dist/components/Tabs/WTabsItem.vue'

const value = ref('')

onMounted(() => {
  
})
</script>