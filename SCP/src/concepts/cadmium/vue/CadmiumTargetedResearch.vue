<script setup lang="ts">
/**
 * CadmiumTargetedResearch — TRGC · the targeted-research composition (Diamond RAR · W5)
 *
 * Surfaces the Diamond research paradigm + the 3rd STCP output stream:
 *   - SDSD · a STATIC Diamond explainer menu: an inner <ShatteriteMenu> fed an EMPTY menuStage
 *     (stageIndex -1) so the static `:default-stage` ALWAYS wins (the live agent menu is the
 *     SEPARATE top-level ShatteriteMenu in CadmiumLanding · this inner one is the explainer).
 *     The defaultStage (CADMIUM_DIAMOND_STATIC_STAGE) carries the Diamond / Macro / Epoch scale
 *     rows with Length tooltips. Picking a scale curries `SCS:Diamond Scale: <scale>` to the
 *     Anchor via the existing ShatteriteMenu SCS-dispatch path (anchor-gated · S4 H3).
 *   - RBSS · CadmiumResearchBulletin — the 3rd STCP article stream (targeted/researchBulletin.json
 *     → relay cadmiumSetResearchBulletin → researchBulletin slot).
 *
 * Pure render surface — parent (CadmiumLanding) owns all state. defaultStage is THREADED in as a
 * prop (CadmiumLanding passes CADMIUM_DIAMOND_STATIC_STAGE) per the WGB component contract.
 *
 * Pewter Tessera HiFi: Suite 2 Orange. Patterns: TRGC · SDSD · RBSS
 * Citation: RAR-DIAMOND-WGB.md §COMPONENT CONTRACTS (TRGC) · §W4 SDSD · §W5
 */
import type { CadmiumArticle, DiamondScale, MenuStage } from '../cadmium.type';
import ShatteriteMenu from '../../suite8/vue/components/ShatteriteMenu.vue';
// C468 · the FILE-BROWSER-resembling tree CASCADED here (the user's Cadmium wrap-up): the
// Research Bulletin rides the SAME CadmiumArticleTree the Topic Bulletin uses — topics as
// expandable dirs · articles as rows · BDRP detail (endpoint-base differentiates).
import CadmiumArticleTree from './CadmiumArticleTree.vue';

defineProps<{
  // The page's Suite 8 designation — used by the inner ShatteriteMenu to find its Anchor.
  suite8Name: string;
  // The 3rd STCP output stream (targeted-research articles · CadmiumArticle[]).
  researchBulletin: CadmiumArticle[];
  // The current Diamond scale (threaded for parity · the scale rows curry SCS to set it).
  diamondScale: DiamondScale;
  // SDSD · the static Diamond explainer stage (CADMIUM_DIAMOND_STATIC_STAGE · threaded by parent).
  defaultStage: MenuStage;
  // Diamond TRP · W5 · the LIVE targeted-research menu stage (4th STCP · targeted/targeted-menu.json
  // relay drives it). The inner ShatteriteMenu renders this when stageIndex >= 0; absent a live
  // stage it falls back to `defaultStage` (the static Diamond explainer · effectiveStage two-branch).
  targetedMenuStage: MenuStage;
}>();
</script>

<template>
  <section class="targeted-research">
    <div class="hifi-stamp">
      <h2 class="bulletin-section-title">Targeted Research</h2>
      <span class="hifi-label">Diamond Scale · Research Bulletin</span>
    </div>

    <!-- Diamond TRP · W5 · the LIVE targeted-research menu (4th STCP · targeted/targeted-menu.json).
         The inner ShatteriteMenu renders the live `targetedMenuStage` when its stageIndex >= 0;
         absent a live stage it falls back to the static `defaultStage` (CADMIUM_DIAMOND_STATIC_STAGE
         Diamond explainer) via effectiveStage's two-branch. The Anchor authors pairDirective rows
         into targeted-menu.json that reflect the CURRENT Diamond work. -->
    <!-- C484 · the Landing menu is the ANCHOR AUTHORITY for Cadmium Researcher; this one
         renders + dispatches to the SAME session with lifecycle silent (the double, resolved). -->
    <ShatteriteMenu
      :no-anchor-authority="true"
      :menu-stage="targetedMenuStage"
      :suite8-name="suite8Name"
      :default-stage="defaultStage"
      title="Targeted Research"
    />

    <!-- RBSS · the 3rd STCP output stream (targeted-research article cards · usePelb citations).
         LBGC · rides the generalised LiveBulletin (endpoint-base '/cadmium-research-bulletin' ·
         identical render to the prior CadmiumResearchBulletin · the Topic Bulletin uses the same
         component with a different endpoint-base). -->
    <CadmiumArticleTree
      :articles="researchBulletin"
      endpoint-base="/cadmium-research-bulletin"
      title="Research Bulletin"
    />
  </section>
</template>

<style scoped>
.targeted-research {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hifi-stamp {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #44351a;
}

.bulletin-section-title {
  color: #f97316;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.hifi-label {
  color: #a8a29e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
