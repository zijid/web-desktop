<script setup>
/**
 * 代码编辑器 - 查看和编辑源代码
 */
import CodeEditor from '@/components/editor/editor.vue'
import Win from '@/components/window/window.vue'
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '代码编辑器' },
  pid: { type: Number, default: 0 },
  filePath: { type: String, default: '' },
  args: { type: String, default: '' },
  path: { type: String, default: '' },
  pwd: { type: String, default: '' }
})
const displayTitle = ref(props.title)
onMounted(() => {
  if (props.args) displayTitle.value = props.args
  else if (props.filePath) displayTitle.value = props.filePath
})
</script>
<template>
  <Win :pid="pid" :path="path">
    <template #title>{{ displayTitle }}</template>
    <CodeEditor :title="title" :pid="pid" :pwd="pwd" :file-path="filePath" :args="args" />
  </Win>
</template>
