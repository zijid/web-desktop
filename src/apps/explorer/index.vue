<script setup>
/**
 * 文件管理器 — 适配器
 * 直接复用现有的 explorer 组件
 */
import Explorer from '@/components/explorer/explorer.vue'
</script>
<template>
  <Explorer v-bind="$attrs" />
</template>
