<script setup>
/**
 * 文本查看器 - 适配器
 */
import TextViewer from '@/components/textviewer/textviewer.vue'
import Win from '@/components/window/window.vue'
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '文本查看器' },
  pid: { type: Number, default: 0 },
  filePath: { type: String, default: '' },
  args: { type: String, default: '' },
  path: { type: String, default: '' },
  pwd: { type: String, default: '' }
})

const displayTitle = ref(props.title)

onMounted(() => {
  const effectivePath = props.filePath || props.path
  const name = (props.args || effectivePath || '').split('/').pop()
  if (name) displayTitle.value = name
})
</script>
<template>
  <Win :pid="pid" :path="path">
    <template #title>{{ displayTitle }}</template>
    <TextViewer :title="title" :pid="pid" :pwd="pwd" :file-path="filePath || path" :args="args" />
  </Win>
</template>
