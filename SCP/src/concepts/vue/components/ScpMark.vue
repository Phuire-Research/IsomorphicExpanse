<script setup lang="ts">
// THE SCP MARK (C809) — the one-tag application of the HiFi formalization: the term SCP as
// the Cascade's odd suites (red/yellow/blue) with the alternating complementary shadows
// (orange/green/purple · the Pewter D4 idiom). Pure presentation; no state.
// THE PLURAL PROP (the `SCP s` gap): the mark's letter-spacing leaves P's trailing space
// before an adjacent external 's' text node — the plural renders INSIDE the mark (the
// mark's own font · the surrounding text's color · pulled tight) so 'SCPs' sets clean
// at every scale.
defineProps<{ plural?: boolean }>();
</script>

<template>
  <span class="hifi-scp-mark"><span class="scp-s">S</span><span class="scp-c">C</span><span class="scp-p">P</span><span v-if="plural" class="scp-plural">s</span></span>
</template>
