<template>
  <Toast />
  <ConfirmDialog />
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from '@/stores/auth'
import { isBiometricEnabled } from '@/platform/biometric'

const authStore = useAuthStore()

onMounted(() => {
  if (!Capacitor.isNativePlatform()) return

  App.addListener('appStateChange', async ({ isActive }) => {
    if (!isActive && authStore.isAuthenticated && (await isBiometricEnabled())) {
      authStore.lockSession()
    }
  })
})
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
