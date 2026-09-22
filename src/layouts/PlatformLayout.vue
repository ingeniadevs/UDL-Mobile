<template>
  <div class="platform-theme platform-shell min-h-screen flex flex-column">
    <header class="platform-topbar flex align-items-center justify-content-between px-4 py-3">
      <div class="flex align-items-center gap-3">
        <div class="brand-mark">IL</div>
        <div>
          <div class="font-bold text-lg leading-tight">
            <span class="il-gradient-text">Ingenia</span><span class="text-white">Clubes</span>
          </div>
          <div class="text-xs platform-muted">Consola de plataforma</div>
        </div>
      </div>
      <div class="flex align-items-center gap-3">
        <span class="text-sm platform-muted hidden sm:inline">{{ auth.user?.nombre || auth.user?.email }}</span>
        <Button icon="pi pi-sign-out" text rounded severity="danger" @click="logout" v-tooltip.bottom="'Salir'" />
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="platform-nav p-3 hidden md:block">
        <nav class="flex flex-column gap-1">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            active-class="nav-link-active"
          >
            <i :class="item.icon" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 overflow-auto p-3 md:p-4">
        <div class="md:hidden mb-3 flex gap-2">
          <Button
            v-for="item in nav"
            :key="item.to"
            :label="item.label"
            :outlined="route.path !== item.to && !route.path.startsWith(item.to + '/')"
            size="small"
            @click="$router.push(item.to)"
          />
        </div>
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { usePlatformAuthStore } from '@/stores/platformAuth'
import Button from 'primevue/button'
import '@/assets/platform-theme.css'

const route = useRoute()
const router = useRouter()
const auth = usePlatformAuthStore()

const nav = [
  { to: '/platform/tenants', label: 'Tenants', icon: 'pi pi-building' },
  { to: '/platform/audit', label: 'Auditoría', icon: 'pi pi-history' }
]

function logout() {
  auth.logout()
  router.push('/platform/login')
}
</script>

<style scoped>
.platform-shell {
  background: var(--il-aurora);
  color: var(--il-text);
}

.platform-topbar {
  border-bottom: 1px solid var(--il-border);
  background: rgba(10, 15, 30, 0.9);
  backdrop-filter: blur(12px);
}

.brand-mark {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  display: grid;
  place-items: center;
  font-weight: 800;
  letter-spacing: 0.02em;
  background: var(--il-gradient);
  color: white;
}

.platform-muted {
  color: var(--il-muted);
}

.platform-nav {
  width: 14rem;
  border-right: 1px solid var(--il-border);
  background: rgba(10, 15, 30, 0.65);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.65rem;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(124, 58, 237, 0.1);
  color: #e2e8f0;
}

.nav-link-active {
  background: rgba(124, 58, 237, 0.18);
  color: #c4b5fd;
}
</style>
