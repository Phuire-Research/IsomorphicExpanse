<script setup lang="ts">
// W4 · THE-MENU-CROSSES-THE-HARNESS — the harness is a passthrough, so the live agent-authored
// MenuStage the landing page holds (keyed on the IsomorphicExpanse designation) crosses it as a
// PROP. No new relay plumbing: the page already subscribes shatteriteMenus; the harness only
// forwards. OPTIONAL so GameView still mounts standalone (menuStage undefined -> static dialog).
import type { MenuStage } from '../../../../model/shatteriteMenu.model'
import GameView from '../../game/vue/GameView.vue'

defineProps<{ menuStage?: MenuStage }>()
</script>

<template>
  <GameView :menu-stage="menuStage" />
</template>
