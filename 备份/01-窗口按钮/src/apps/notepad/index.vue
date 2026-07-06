<script setup>
/**
 * 记事本 — 适配器
 * 直接复用现有的记事本组件
 */
import Notepad from '@/components/notepad/notepad.vue'
</script>
<template>
  <Notepad v-bind="$attrs" />
</template>
