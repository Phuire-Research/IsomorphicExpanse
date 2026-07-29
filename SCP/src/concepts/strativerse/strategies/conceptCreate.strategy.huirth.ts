/**
 * conceptCreate Strategy - Scaffold New Concept in Managed Project (Means 11)
 *
 * 13-node chain (all always execute):
 * 1. fileSystemCreateTargetDirectory - Create qualities/ subdir (recursive creates concept dir)
 * 2. fileSystemCreateTargetDirectory - Create vue/ subdir
 * 3. fileSystemCreateTargetDirectory - Create css/ subdir (HiFi Island Styling)
 * 4. fileSystemCreateFileWithContentsIndex - Create {name}.concept.ts
 * 5. fileSystemCreateFileWithContentsIndex - Create qualities/types.ts
 * 6. fileSystemCreateFileWithContentsIndex - Create {name}.muxonomy.ts
 * 7. fileSystemCreateFileWithContentsIndex - Create css/{name}.css (HiFi extending styles)
 * 8. fileSystemCreateFileWithContentsIndex - Create vue/{Pascal}Landing.vue (imports CSS)
 * 9. grepReplaceInFiles - Insert import in huirth.concept.ts
 * 10. grepReplaceInFiles - Insert muxifyConcepts entry in huirth.concept.ts
 * 11. grepReplaceInFiles - Insert muxonomy import in vue.principle.ts
 * 12. grepReplaceInFiles - Insert REGISTERED_MUXONOMICS entry in vue.principle.ts
 * 13. grepReplaceInFiles - Insert island registry entry in IslandWrapper.vue
 *
 * SCP Tool: strativerse_concept_create
 * Tool Type: actionable
 *
 * Citation: SUITE-5-COBALT-POC4-PHASE3-C2-C3-ROADMAP.md
 * Citation: SUITE-TAILWINDCSS-HIFI-STYLING-WORKGAMEBOARD.md Layer 3
 * Citation: STRATIMUX-REFERENCE.md "ActionStrategies"
 */
import {
  ActionStrategy,
  Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { GrepConcept } from '../../grep/grep.type';
import type { FileSystemConcept } from '../../fileSystem/fileSystem.concept';
import type { SCPStrategyCreator } from '../../scp/scp.types';
import path from 'path';

// ============================================
// SPECIFICATION TYPE
// ============================================

export type ConceptCreateSpecification = {
  projectPath: string;
  conceptName: string;
  stateName: string;
  location: 'huirth' | 'client' | 'all';
  stateFields: Array<{ name: string; type: string; defaultValue: string }>;
  landingPageEnabled?: boolean;
  navigationConfig?: { label: string; icon: string; color: string; order: number };
};

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is ConceptCreateSpecification {
  var s = spec as ConceptCreateSpecification;
  return !!(
    s &&
    s.projectPath &&
    typeof s.projectPath === 'string' &&
    s.conceptName &&
    typeof s.conceptName === 'string' &&
    s.stateName &&
    typeof s.stateName === 'string' &&
    s.location &&
    (s.location === 'huirth' || s.location === 'client' || s.location === 'all') &&
    Array.isArray(s.stateFields)
  );
}

// ============================================
// HELPERS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// CONTENT GENERATORS
// ============================================

function generateConceptFileContent(
  conceptName: string,
  stateName: string,
  pascalName: string,
  stateFields: Array<{ name: string; type: string; defaultValue: string }>
): string {
  var lines: string[] = [];
  lines.push('import {');
  lines.push('  createConcept,');
  lines.push('} from \'stratimux\';');
  lines.push('import { type ' + stateName + ' } from \'./qualities/types\';');
  lines.push('');
  lines.push('var initial' + pascalName + 'State: ' + stateName + ' = {');
  for (var i = 0; i < stateFields.length; i++) {
    var field = stateFields[i];
    var comma = i < stateFields.length - 1 ? ',' : '';
    lines.push('  ' + field.name + ': ' + field.defaultValue + comma);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const create' + pascalName + 'Concept = () =>');
  lines.push('  createConcept(');
  lines.push('    \'' + conceptName + '\',');
  lines.push('    initial' + pascalName + 'State,');
  lines.push('    {},');
  lines.push('    [],');
  lines.push('  );');
  lines.push('');
  return lines.join('\n');
}

function generateTypesFileContent(
  stateName: string,
  stateFields: Array<{ name: string; type: string; defaultValue: string }>
): string {
  var lines: string[] = [];
  lines.push('export type ' + stateName + ' = {');
  for (var i = 0; i < stateFields.length; i++) {
    var field = stateFields[i];
    var comma = i < stateFields.length - 1 ? ';' : ';';
    lines.push('  ' + field.name + ': ' + field.type + comma);
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

function generateMuxonomyFileContent(
  conceptName: string,
  pascalName: string,
  landingPageEnabled: boolean,
  navConfig: { label: string; icon: string; color: string; order: number }
): string {
  var lines: string[] = [];
  lines.push('import {');
  lines.push('  type MuxonomicConfig,');
  lines.push('  type NavigationConfig,');
  lines.push('  type PageEntry,');
  lines.push('  ChangeDetectionMode,');
  lines.push('  DeploymentTarget,');
  lines.push('} from \'../muxonomy/muxonomy.model\';');
  lines.push('');
  lines.push('var ' + conceptName + 'LandingPage: PageEntry = {');
  lines.push('  path: \'/' + conceptName + '\',');
  lines.push('  label: \'' + navConfig.label + '\',');
  lines.push('  order: 0,');
  lines.push('  componentPath: \'' + conceptName + '/vue/' + pascalName + 'Landing\',');
  lines.push('  isMain: true,');
  lines.push('};');
  lines.push('');
  lines.push('var ' + conceptName + 'Navigation: NavigationConfig = {');
  lines.push('  isMainLanding: false,');
  lines.push('  icon: \'' + navConfig.icon + '\',');
  lines.push('  color: \'' + navConfig.color + '\',');
  lines.push('  label: \'' + navConfig.label + '\',');
  lines.push('  order: ' + String(navConfig.order) + ',');
  lines.push('  pages: [');
  lines.push('    ' + conceptName + 'LandingPage,');
  lines.push('  ],');
  lines.push('  enabled: ' + String(landingPageEnabled) + ',');
  lines.push('};');
  lines.push('');
  lines.push('export var ' + conceptName + 'Muxonomic: MuxonomicConfig<\'' + conceptName + '\'> = {');
  lines.push('  conceptName: \'' + conceptName + '\',');
  lines.push('  filterKeys: [],');
  lines.push('  novelChange: {');
  lines.push('    mode: ChangeDetectionMode.KeyedSelector,');
  lines.push('  },');
  lines.push('  sync: {');
  lines.push('    direction: \'toClient\',');
  lines.push('    filterKeys: [],');
  lines.push('    novelChange: {');
  lines.push('      mode: ChangeDetectionMode.KeyedSelector,');
  lines.push('    },');
  lines.push('  },');
  lines.push('  demometers: {');
  lines.push('    qualities: [],');
  lines.push('    strategies: [],');
  lines.push('    principles: [],');
  lines.push('  },');
  lines.push('  decks: {');
  lines.push('    huirth: \'' + pascalName + 'HuirthDeck\',');
  lines.push('    client: \'' + pascalName + 'ClientDeck\',');
  lines.push('  },');
  lines.push('  navigation: ' + conceptName + 'Navigation,');
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

function generateCssFileContent(
  conceptName: string,
  pascalName: string,
  color: string
): string {
  var suiteColor = color || 'cobalt';
  var lines: string[] = [];
  lines.push('/**');
  lines.push(' * ' + pascalName + ' Island Styling');
  lines.push(' *');
  lines.push(' * Extends HiFi Functional Design Base (src/assets/hifi-base.css)');
  lines.push(' * Suite: ' + suiteColor.charAt(0).toUpperCase() + suiteColor.slice(1) + ' theme');
  lines.push(' *');
  lines.push(' * CSS Loading Order:');
  lines.push(' * 1. hifi-base.css (global - imported in main.ts)');
  lines.push(' * 2. ' + conceptName + '.css (island-specific - imported in ' + pascalName + 'Landing.vue)');
  lines.push(' *');
  lines.push(' * Citation: SUITE-TAILWINDCSS-HIFI-STYLING-WORKGAMEBOARD.md Layer 2');
  lines.push(' */');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   ' + conceptName.toUpperCase() + ' ISLAND CUSTOM PROPERTIES');
  lines.push('   Extends/overrides base HiFi variables');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.' + conceptName + '-landing {');
  lines.push('  /* Island-specific theme: ' + suiteColor + ' primary */');
  lines.push('  --island-primary: var(--color-' + suiteColor + ');');
  lines.push('  --island-secondary: var(--color-ochre);');
  lines.push('  --island-accent: var(--color-viridian);');
  lines.push('');
  lines.push('  /* Surface colors using HiFi Obsidian base */');
  lines.push('  --island-surface: var(--color-obsidian);');
  lines.push('  --island-surface-elevated: rgba(var(--color-' + suiteColor + '-rgb, 0, 71, 171), 0.08);');
  lines.push('');
  lines.push('  /* Text hierarchy */');
  lines.push('  --island-text-primary: #f3f4f6;');
  lines.push('  --island-text-secondary: #9ca3af;');
  lines.push('  --island-text-accent: var(--color-' + suiteColor + ');');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   ' + conceptName.toUpperCase() + ' LANDING LAYOUT');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.' + conceptName + '-landing {');
  lines.push('  min-height: 100vh;');
  lines.push('  background: var(--island-surface);');
  lines.push('  background-image: var(--texture-obsidian);');
  lines.push('  padding: 2rem;');
  lines.push('  font-family: var(--font-body);');
  lines.push('  color: var(--island-text-primary);');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   ' + conceptName.toUpperCase() + ' HEADER');
  lines.push('   Uses Bidirectional Conference Typography');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.landing-header {');
  lines.push('  text-align: center;');
  lines.push('  margin-bottom: 2rem;');
  lines.push('}');
  lines.push('');
  lines.push('.landing-header h1 {');
  lines.push('  font-family: var(--font-display);');
  lines.push('  font-weight: 700;');
  lines.push('  color: var(--island-primary);');
  lines.push('  font-size: 2.5rem;');
  lines.push('  margin-bottom: 0.5rem;');
  lines.push('}');
  lines.push('');
  lines.push('.subtitle {');
  lines.push('  font-family: var(--font-mono);');
  lines.push('  color: var(--island-text-secondary);');
  lines.push('  font-size: 0.875rem;');
  lines.push('  letter-spacing: 0.1em;');
  lines.push('  text-transform: uppercase;');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   ' + conceptName.toUpperCase() + ' CONTENT PANELS');
  lines.push('   HiFi Card styling with ' + suiteColor + ' theme');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.landing-content {');
  lines.push('  max-width: 900px;');
  lines.push('  margin: 0 auto;');
  lines.push('  display: flex;');
  lines.push('  flex-direction: column;');
  lines.push('  gap: 2rem;');
  lines.push('}');
  lines.push('');
  lines.push('.status-panel,');
  lines.push('.info-panel {');
  lines.push('  /* HiFi Card base with ' + suiteColor + ' accent */');
  lines.push('  background:');
  lines.push('    radial-gradient(');
  lines.push('      ellipse at var(--spotlight-x) var(--spotlight-y),');
  lines.push('      var(--island-surface-elevated) 0%,');
  lines.push('      transparent 88%');
  lines.push('    ),');
  lines.push('    var(--island-surface);');
  lines.push('  background-image: var(--texture-' + suiteColor + ');');
  lines.push('');
  lines.push('  /* HiFi Dimensional Borders - 8% differential */');
  lines.push('  border-top: 1px solid rgba(var(--color-' + suiteColor + '-rgb, 0, 71, 171), 0.12);');
  lines.push('  border-right: 1px solid rgba(var(--color-' + suiteColor + '-rgb, 0, 71, 171), 0.12);');
  lines.push('  border-bottom: 1px solid rgba(var(--color-' + suiteColor + '-rgb, 0, 71, 171), 0.28);');
  lines.push('  border-left: 1px solid rgba(var(--color-' + suiteColor + '-rgb, 0, 71, 171), 0.28);');
  lines.push('');
  lines.push('  /* Sharp corners for decision panes */');
  lines.push('  border-radius: 0;');
  lines.push('  padding: 1.5rem;');
  lines.push('');
  lines.push('  /* HiFi Shadow */');
  lines.push('  box-shadow: -3px 3px 0 var(--shadow-' + suiteColor + ');');
  lines.push('}');
  lines.push('');
  lines.push('.status-panel h2,');
  lines.push('.info-panel h2 {');
  lines.push('  font-family: var(--font-display);');
  lines.push('  font-weight: 600;');
  lines.push('  color: var(--island-primary);');
  lines.push('  font-size: 0.875rem;');
  lines.push('  text-transform: uppercase;');
  lines.push('  letter-spacing: 0.1em;');
  lines.push('  margin-bottom: 1rem;');
  lines.push('  margin-top: 0;');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   STATUS INDICATORS');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.status-grid {');
  lines.push('  display: grid;');
  lines.push('  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));');
  lines.push('  gap: 1rem;');
  lines.push('}');
  lines.push('');
  lines.push('.status-item {');
  lines.push('  display: flex;');
  lines.push('  flex-direction: column;');
  lines.push('  gap: 0.25rem;');
  lines.push('}');
  lines.push('');
  lines.push('.status-label {');
  lines.push('  font-family: var(--font-mono);');
  lines.push('  color: var(--island-text-secondary);');
  lines.push('  font-size: 0.75rem;');
  lines.push('  text-transform: uppercase;');
  lines.push('  letter-spacing: 0.05em;');
  lines.push('}');
  lines.push('');
  lines.push('.status-value {');
  lines.push('  font-family: var(--font-mono);');
  lines.push('  color: var(--island-text-primary);');
  lines.push('  font-size: 1rem;');
  lines.push('}');
  lines.push('');
  lines.push('.status-value.loading {');
  lines.push('  color: var(--color-ochre);');
  lines.push('}');
  lines.push('');
  lines.push('.status-value.ready {');
  lines.push('  color: var(--color-viridian);');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   INFO CONTENT');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('.info-content {');
  lines.push('  font-family: var(--font-body);');
  lines.push('  color: var(--island-text-secondary);');
  lines.push('  line-height: 1.6;');
  lines.push('}');
  lines.push('');
  lines.push('.info-content p {');
  lines.push('  margin-bottom: 0.75rem;');
  lines.push('  margin-top: 0;');
  lines.push('}');
  lines.push('');
  lines.push('/* ============================================');
  lines.push('   RESPONSIVE ADJUSTMENTS');
  lines.push('   ============================================ */');
  lines.push('');
  lines.push('@media (max-width: 768px) {');
  lines.push('  .' + conceptName + '-landing {');
  lines.push('    padding: 1rem;');
  lines.push('  }');
  lines.push('');
  lines.push('  .landing-header h1 {');
  lines.push('    font-size: 1.75rem;');
  lines.push('  }');
  lines.push('');
  lines.push('  .status-panel,');
  lines.push('  .info-panel {');
  lines.push('    padding: 1rem;');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generateLandingPageContent(
  conceptName: string,
  pascalName: string
): string {
  var lines: string[] = [];
  lines.push('<script setup lang="ts">');
  lines.push('import { ref, onMounted, onUnmounted, provide } from \'vue\'');
  lines.push('import type { Muxium } from \'stratimux\'');
  lines.push('import { createClientMuxiumInstance } from \'../../client/client.muxonomy\'');
  lines.push('');
  lines.push('// Island-specific styling (extends hifi-base.css)');
  lines.push('import \'../css/' + conceptName + '.css\'');
  lines.push('');
  lines.push('type ClientDeck = any;');
  lines.push('');
  lines.push('var isConnected = ref<boolean>(false)');
  lines.push('var connectionStatus = ref<string>(\'Initializing...\')');
  lines.push('');
  lines.push('var muxium: Muxium<ClientDeck> | null = null');
  lines.push('var stagePlanner: any = null');
  lines.push('');
  lines.push('onMounted(() => {');
  lines.push('  if (typeof window === \'undefined\') return;');
  lines.push('');
  lines.push('  muxium = createClientMuxiumInstance([], {');
  lines.push('    title: \'' + pascalName + 'Landing\',');
  lines.push('    logging: true,');
  lines.push('    storeDialog: true,');
  lines.push('  }) as Muxium<ClientDeck>');
  lines.push('');
  lines.push('  provide(\'muxium\', muxium)');
  lines.push('');
  lines.push('  stagePlanner = muxium.plan<ClientDeck>(\'' + conceptName + 'LandingSubscription\', ({ staging, stage, d__ }) => staging(() => {');
  lines.push('    return [');
  lines.push('      stage(');
  lines.push('        ({ d }) => {');
  lines.push('          var connected = d.client.d.webSocketClient.k.isConnected.select()');
  lines.push('          isConnected.value = connected');
  lines.push('          connectionStatus.value = connected ? \'Connected\' : \'Connecting...\'');
  lines.push('        },');
  lines.push('        {');
  lines.push('          selectors: [d__.client.d.webSocketClient.k.isConnected]');
  lines.push('        }');
  lines.push('      )');
  lines.push('    ]');
  lines.push('  }))');
  lines.push('})');
  lines.push('');
  lines.push('onUnmounted(() => {');
  lines.push('  if (stagePlanner) {');
  lines.push('    stagePlanner.conclude()');
  lines.push('  }');
  lines.push('  if (muxium) {');
  lines.push('    muxium.close()');
  lines.push('  }');
  lines.push('})');
  lines.push('</script>');
  lines.push('');
  lines.push('<template>');
  lines.push('  <div class="' + conceptName + '-landing">');
  lines.push('    <header class="landing-header">');
  lines.push('      <h1>' + pascalName + '</h1>');
  lines.push('      <p class="subtitle">Concept Landing Page</p>');
  lines.push('    </header>');
  lines.push('');
  lines.push('    <main class="landing-content">');
  lines.push('      <section class="status-panel">');
  lines.push('        <h2>Connection Status</h2>');
  lines.push('        <div class="status-grid">');
  lines.push('          <div class="status-item">');
  lines.push('            <span class="status-label">State</span>');
  lines.push('            <span :class="[\'status-value\', isConnected ? \'ready\' : \'loading\']">');
  lines.push('              {{ connectionStatus }}');
  lines.push('            </span>');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('');
  lines.push('      <section class="info-panel">');
  lines.push('        <h2>' + pascalName + ' Concept</h2>');
  lines.push('        <div class="info-content">');
  lines.push('          <p>Landing page for the ' + conceptName + ' concept.</p>');
  lines.push('          <p>This page creates a ClientMuxium with base concepts and subscribes to WebSocket connection state.</p>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('    </main>');
  lines.push('  </div>');
  lines.push('</template>');
  lines.push('');
  lines.push('<!--');
  lines.push('  ' + pascalName + ' Island Styling loaded via: ../css/' + conceptName + '.css');
  lines.push('  Extends HiFi Functional Design Base (src/assets/hifi-base.css)');
  lines.push('');
  lines.push('  CSS Loading Order:');
  lines.push('  1. hifi-base.css (global)');
  lines.push('  2. ' + conceptName + '.css (island-specific)');
  lines.push('-->');
  lines.push('');
  return lines.join('\n');
}

// ============================================
// STRATEGY CREATOR
// ============================================

export const createStrativerseConceptCreateStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means11:ConceptCreate]';
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Params:', JSON.stringify(params, null, 2));

  var specification = params.specification as ConceptCreateSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED');
    console.error(LOG_PREFIX + ' Specification:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var projectPath = specification.projectPath;
  var conceptName = specification.conceptName;
  var stateName = specification.stateName;
  var pascalName = capitalizeFirst(conceptName);
  var landingPageEnabled = specification.landingPageEnabled !== false; // Default: enabled
  var navConfig = specification.navigationConfig || {
    label: pascalName,
    icon: '\u{1F4E6}',
    color: 'cobalt',
    order: 99,
  };

  console.log(LOG_PREFIX + ' Validated: ' + conceptName + ' (' + stateName + ') in ' + projectPath);
  console.log(LOG_PREFIX + ' Landing page enabled: ' + String(landingPageEnabled));

  var fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  var grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');

  if (!fileSystemDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - fileSystem');
    return undefined;
  }
  if (!grepDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - grep');
    return undefined;
  }
  console.log(LOG_PREFIX + ' All decks acquired (fileSystem, grep)');

  var conceptDir = path.join(projectPath, 'src', 'concepts', conceptName);
  var stateFields = specification.stateFields;

  var conceptFileContent = generateConceptFileContent(conceptName, stateName, pascalName, stateFields);
  var typesFileContent = generateTypesFileContent(stateName, stateFields);
  var muxonomyFileContent = generateMuxonomyFileContent(conceptName, pascalName, landingPageEnabled, navConfig);
  var cssFileContent = generateCssFileContent(conceptName, pascalName, navConfig.color);
  var landingPageContent = generateLandingPageContent(conceptName, pascalName);

  console.log(LOG_PREFIX + ' Building 13-node chain (with CSS support)...');

  // Node 11 (Final): Insert island registry entry in IslandWrapper.vue
  var islandRegistryNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "default: \\(\\) => import\\('../vue/vue/DefaultLanding\\.vue'\\),",
      replaceWith: "default: () => import('../vue/vue/DefaultLanding.vue'),\n    " + conceptName + ": () => import('../" + conceptName + "/vue/" + pascalName + "Landing.vue'),",
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'IslandWrapper.vue',
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'Island registry entry added to IslandWrapper.vue.',
      },
    }
  );

  // Node 10: Insert REGISTERED_MUXONOMICS entry in vue.principle.ts
  var registeredMuxonomicsNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: 'DEFAULT_LANDING_MUXONOMIC,',
      replaceWith: 'DEFAULT_LANDING_MUXONOMIC,\n  ' + conceptName + 'Muxonomic,',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'vue.principle.ts',
      dryRun: false,
    }),
    {
      successNode: islandRegistryNode,
      successNotes: {
        preposition: 'then',
        denoter: 'REGISTERED_MUXONOMICS entry added;',
      },
    }
  );

  // Node 9: Insert muxonomy import in vue.principle.ts
  var vueMuxonomyImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "import { type MuxonomicConfig, type PageEntry, ChangeDetectionMode } from '../muxonomy/muxonomy.model';",
      replaceWith: "import { type MuxonomicConfig, type PageEntry, ChangeDetectionMode } from '../muxonomy/muxonomy.model';\nimport { " + conceptName + "Muxonomic } from '../" + conceptName + "/" + conceptName + ".muxonomy';",
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'vue.principle.ts',
      dryRun: false,
    }),
    {
      successNode: registeredMuxonomicsNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Muxonomy import added to vue.principle.ts;',
      },
    }
  );

  // Node 8: Insert muxifyConcepts entry in huirth.concept.ts
  var muxifyConceptsNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: 'createSCPConcept\\(\\),',
      replaceWith: 'createSCPConcept(),\n        create' + pascalName + 'Concept(),',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'huirth'),
      fileGlob: 'huirth.concept.ts',
      dryRun: false,
    }),
    {
      successNode: vueMuxonomyImportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'muxifyConcepts entry added;',
      },
    }
  );

  // Node 7: Insert import in huirth.concept.ts
  var huirthImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "import { createSCPConcept } from '../scp/scp.concept';",
      replaceWith: "import { createSCPConcept } from '../scp/scp.concept';\nimport { create" + pascalName + "Concept } from '../" + conceptName + "/" + conceptName + ".concept';",
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'huirth'),
      fileGlob: 'huirth.concept.ts',
      dryRun: false,
    }),
    {
      successNode: muxifyConceptsNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Import added to huirth.concept.ts;',
      },
    }
  );

  // Node 6: Create Vue landing page
  var createLandingPageNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: path.join(conceptDir, 'vue', pascalName + 'Landing.vue'),
      content: landingPageContent,
    }),
    {
      successNode: huirthImportNode,
      successNotes: {
        preposition: 'then',
        denoter: pascalName + 'Landing.vue created;',
      },
    }
  );

  // Node 7: Create CSS file
  var createCssFileNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: path.join(conceptDir, 'css', conceptName + '.css'),
      content: cssFileContent,
    }),
    {
      successNode: createLandingPageNode,
      successNotes: {
        preposition: 'then',
        denoter: 'css/' + conceptName + '.css created;',
      },
    }
  );

  // Node 6: Create muxonomy file
  var createMuxonomyNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: path.join(conceptDir, conceptName + '.muxonomy.ts'),
      content: muxonomyFileContent,
    }),
    {
      successNode: createCssFileNode,
      successNotes: {
        preposition: 'then',
        denoter: conceptName + '.muxonomy.ts created;',
      },
    }
  );

  // Node 4: Create types file
  var createTypesNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: path.join(conceptDir, 'qualities', 'types.ts'),
      content: typesFileContent,
    }),
    {
      successNode: createMuxonomyNode,
      successNotes: {
        preposition: 'then',
        denoter: 'qualities/types.ts created;',
      },
    }
  );

  // Node 3: Create concept file
  var createConceptNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: path.join(conceptDir, conceptName + '.concept.ts'),
      content: conceptFileContent,
    }),
    {
      successNode: createTypesNode,
      successNotes: {
        preposition: 'then',
        denoter: conceptName + '.concept.ts created;',
      },
    }
  );

  // Node 3: Create css/ subdirectory
  var createCssDirNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateTargetDirectory({
      path: path.join(conceptDir, 'css'),
    }),
    {
      successNode: createConceptNode,
      successNotes: {
        preposition: 'then',
        denoter: 'css/ directory created;',
      },
    }
  );

  // Node 2: Create vue/ subdirectory
  var createVueDirNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateTargetDirectory({
      path: path.join(conceptDir, 'vue'),
    }),
    {
      successNode: createCssDirNode,
      successNotes: {
        preposition: 'then',
        denoter: 'vue/ directory created;',
      },
    }
  );

  // Node 1 (Initial): Create qualities/ subdirectory (recursive creates concept dir)
  var createQualitiesDirNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateTargetDirectory({
      path: path.join(conceptDir, 'qualities'),
    }),
    {
      successNode: createVueDirNode,
      successNotes: {
        preposition: 'First',
        denoter: 'qualities/ directory created (recursive mkdir);',
      },
    }
  );

  var strategy = createStrategy({
    topic: 'StratiVERSE Concept Create - ' + conceptName + ' in ' + projectPath,
    initialNode: createQualitiesDirNode,
    data: {
      specification: specification,
      projectPath: projectPath,
      conceptName: conceptName,
      stateName: stateName,
      pascalName: pascalName,
      landingPageEnabled: landingPageEnabled,
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED: ' + strategy.topic);
  console.log(LOG_PREFIX + ' Node chain: mkdirQualities -> mkdirVue -> mkdirCss -> concept.ts -> types.ts -> muxonomy.ts -> css.css -> Landing.vue -> huirthImport -> muxifyConcepts -> vueImport -> registeredMuxonomics -> islandRegistry');
  return strategy;
};
