<script setup>
/**
 * Notepad adapter - passes through attrs
 */
import Notepad from '@/components/notepad/notepad.vue'
</script>
<template>
  <Notepad v-bind="$attrs" />
</template>
