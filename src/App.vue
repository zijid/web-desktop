<script setup>
import { ref } from "vue";
import systemDesktop from "@/components/system/desktop.vue";
import BootAnimation from "@/components/system/BootAnimation.vue";

const bootEnabled = localStorage.getItem('web-desktop-boot-enabled') !== 'false'
const showBoot = ref(bootEnabled)
const showDesktop = ref(!bootEnabled)

function onBootReady() {
  showDesktop.value = true
}

function onBootComplete() {
  showBoot.value = false
}
</script>

<template>
  <BootAnimation v-if="showBoot" @ready="onBootReady" @complete="onBootComplete" />
  <Suspense v-if="showDesktop">
    <system-desktop />
    <template #fallback>
      <BootAnimation loading />
    </template>
  </Suspense>
</template>

<style scoped src="./App.css"></style>
