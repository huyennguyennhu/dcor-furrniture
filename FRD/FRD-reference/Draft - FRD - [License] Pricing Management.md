# 1. Overview

## 1.1. Purpose

The **Pricing Management** page provides a centralized interface allowing Administrators (Admins) to configure and manage public commercial packages, an intuitive feature comparison matrix, and an automated price estimator to support the external marketing and sales website.

## 1.2. Scope

### 1.2.1. In-Scope Features

- **Pricing Packages Management (Packages Tab):** Create custom packages, sync core licenses, configure public-facing content (multi-language EN/VI support), manage feature checklists within each package, drag-and-drop to reorder, and toggle public advertising visibility.
- **Cost Estimator Configurator (Price Estimator Tab):** Manage estimator modules, link to core system modules, reorder items via drag-and-drop, define global subscription tiers, and set up granular pricing and inclusions per tier.
- **Feature Comparison Matrix (Feature Comparison Tab):** Manage feature categories and specific technical rows, toggle matrix cell statuses (Boolean indicators) or input custom descriptive text per package, and support bulk matrix structure initialization via JSON file import.
- **Supporting Utilities:** Quick language toggle (English / Vietnamese) for simultaneous localization editing and real-time fake Pricing Card live preview.

### 1.2.2. Out-Scope Features

- Online payment gateway integration, actual user invoice processing (Billing), and production subscription lifecycle management.

# 2. User Story

## US-01: Configure and Manage Commercial Pricing Packages (Packages Tab)

**As an** Administrator (Admin),
**I want to** create new custom pricing packages, edit marketing display fields, and adjust their layout sorting order,
**So that** I can optimize marketing campaigns and present accurate service package configurations to external prospects.

#### Acceptance Criteria

- **AC-01:** The Admin can create a standalone custom package or edit the marketing overlay configurations of pre-existing core system licenses.
- **AC-02:** Support parallel multi-language editing (EN/VI) for fields: Display Name, Badge Text, Tagline, Subtitle, CTA Text, CTA Subtext, and inline feature list items.
- **AC-03:** Support manual display reordering using a Drag & Drop mechanism within a dedicated modal popup.
- **AC-04:** The Live Preview panel must instantly update the simulated Pricing Card interface as input fields change on the active form.

#### Scenario 1.1: Creating a New Custom Pricing Package

- **Given:** The Admin is viewing the list view of the **Packages** tab.
- **When:** The Admin clicks the "Create Package" button.
- **Then:** The system switches to Form View with empty fields, sets the default CTA text to "Get Started", defaults the public visibility toggle to "Hidden", and flags the package type as "Custom".

## US-02: Configure Modules and Tiers for the Cost Estimator (Price Estimator Tab)

**As an** Administrator (Admin),

**I want to** establish estimator modules and map tiered pricing models onto them,

**So that** prospective customers can interactively calculate their estimated monthly costs based on custom operational scaling.

#### Acceptance Criteria

- **AC-01:** Allow the definition of a global pool of tier names (Global Tiers) that can be dynamically inherited by individual module tier configurations.
- **AC-02:** The Admin can create, read, update, delete, or rearrange estimator modules dynamically using table row drag-and-drop actions.
- **AC-03:** Allow assigning a monthly flat fee (Price / Mo) and custom inclusion text to each global tier bound inside a specific module.

## US-03: Feature Comparison Tab

**As an** Administrator (Admin),
**I want to** build out the detailed feature comparison matrix across active service tiers,
**So that** prospective customers can explicitly distinguish value differences when considering an upgrade.

#### Acceptance Criteria

- **AC-01:** Matrix columns must automatically synchronize and generate columns using only packages whose status is set to active (`status: 'active'`).
- **AC-02:** Allow the Admin to drag-and-drop entire parent Category Rows to rearrange their vertical priority.
- **AC-03:** The Admin can quickly toggle a feature's availability (Check mark / Minus sign) or provide localized custom text overrides in the corresponding intersection cells.
- **AC-04:** Support instant bulk initialization of the comparison taxonomy matrix by importing an uploaded `.json` schema file.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Tabbed Layout Navigation:** The primary screen is strictly divided into 3 navigational components: `Packages`, `Price Estimator`, and `Feature Comparison`.
- **Language Synchronization (Language Toggle):** Form views across all tabs provide an interactive toggle to switch editing contexts between English (`en`) and Vietnamese (`vi`) instantly. The system must preserve dual-string values concurrently (e.g., storing both `displayName` and `displayName_vi`).
- **Filtering Toolbar:** Provide a text input field on the List View toolbars to dynamically filter modules or packages by name.

## 3.2. Functional Requirements Details

### FR-01: Package List Overview & Form Editor

- **Description:** Displays current commercial offerings as a grid of cards and delivers an inspection form to handle front-facing promotional content.
- **Business Rules:**
    - The system splits packages into two categories: Synced Core Licenses and Custom Packages.
    - For **Synced Core** rows: Core metadata such as the underlying system link (`linkedCoreId`), basic seat calculation pricing (`priceAmount`), and pricing frequency (`priceUnit`) are set to read-only to preserve licensing integrity. Base prices are inferred directly from the package's default seat configuration (`isDefaultSeat`).
    - For **Custom** rows: Admins can manually link them to an active license or select `Custom / None`. All pricing numbers and frequency units remain completely unlocked for modification. Delete capabilities are exclusively restricted to Custom Packages.
- **Pre-conditions:** The user selects the "Packages" tab.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click "Create Package" | Transitions interface to `viewMode = 'form'`, seeding a blank package object with a unique timestamped ID matching `custom_[timestamp]`. |
    | 2. Click "Edit" on a package card | Performs a deep clone of the targeted package data into a temporary state variable (`editingPackage`) and renders the Form View panel. |
    | 3. Toggle Language Selector (EN/VI) | Re-binds form inputs between English property fields and Vietnamese property fields (e.g., swapping `tagline` input with `tagline_vi`). |
    | 4. Click "Add Feature" on the form feature editor | Appends an item line container to the package feature array, containing an icon type dropdown menu (`icon`: Included/Excluded/Disabled) and an empty string field for feature text. |
    | 5. Click "Save & Publish" | Checks the package origin. If custom, dispatches custom package persistence handlers. If core-synced, updates the `marketingConfig` object nested inside the parent license entity via `AppStateService`. Reverts to List View. |

### FR-02: Display Sequence & Visibility Management (Pop-up Settings & Reorder)

- **Description:** Configures the chronological sorting sequence of package cards on the external pricing page and manages visibility switches.
- **Business Rules:** The master layout order is tracked globally as an ordered array of package ID strings (`pricingPackageOrder`).
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click the "Settings" (gear icon) button on the toolbar | Deep clones current packages into `tempPackageList` and reveals the global reorder popup modal. |
    | 2. Hold the drag handler handle (`grip-vertical`) on a row and move it vertically | Evaluates HTML5 drag events, calculates new index arrangements on `drop`, and splices the item position within the `tempPackageList` array. |
    | 3. Click the Visibility toggle switch on a row | Flips the binary `showOnPricingPage` flag (True to False, or vice versa) on that specific index entry inside the temp array. |
    | 4. Click "Save Changes" inside the modal | Commits the updated string array to `handleSavePricingPackageOrder` and propagates updated `showOnPricingPage` parameters across all custom and core items before closing the modal. |

### FR-03: Live Preview Component

- **Description:** Deploys a right-anchored slide-over canvas rendering a layout representation of the active pricing tile.
- **Use Case Specification:** Clicking "Live Preview" sets `showLivePreview = true`, adjusting the working area to project a layout container that mirrors form parameters (`displayName`, `tagline`, pricing figures, text accents, custom feature lists) in real-time.

## 3.3. TAB 2: PRICE ESTIMATOR MANAGEMENT

### FR-04: Global Estimator Tiers Configurator

- **Description:** Manages global tier taxonomy entities used uniformly across modules to formulate matrix cost options.
- **Business Rules:** New string inputs cannot duplicate any pre-existing entry string name in the pool.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click "Global Tiers" on the toolbar | Imports current global tier tags, registers them to a local mutable list, and shows the configuration overlay. |
    | 2. Input a new tier name and hit Enter or click "Add" | Sanitizes string whitespace, verifies distinctness, inserts the new string to the active list, and clears the input box. |
    | 3. Click the trash icon next to an active tier name | Filters out and deletes the targeted tier string from the mutable tracking signal list. |
    | 4. Click "Save Tiers" | Executes `handleUpdateEstimatorTiers` to synchronize tier structures system-wide and closes the modal dialog. |

### FR-05: Estimator Modules & Tier Cost Matrix Configuration

- **Description:** Handles life cycle actions for estimator objects, matches them against primary software feature units, handles vertical sequencing, and prices out tiers individually.
- **Use Case Specification:**
    - **List View:** Admins use "Add Module" to spin up fresh structures, or choose "Edit"/"Delete" on list entries. Reordering is driven by table row handles running on `@angular/cdk/drag-drop` utilities via the `drop($event)` handler.
    - **Form View:**
        - *Linked Core Module Dropdown:* Populates a select component reflecting internal marketing modules registered within the system core service.
        - *Display Name & Description:* Exposes input containers bound to dedicated localized string attributes for dual-language storage.
        - *Tier Pricing & Features List:* Allows rows to be appended. Each entry selects an available tag from Global Tiers, captures a monthly numerical rate input (`price` attribute), and maps a description string of the quota included (e.g., "Includes 500 API calls").

## 3.4. TAB 3: FEATURE COMPARISON MATRIX

### FR-06: Comparison Taxonomy & Matrix Grid Cell Editor

- **Description:** Maps cross-functional feature specifications across running pricing tiers.
- **Business Rules:**
    - Column 0 is locked for the feature key description string (`Feature Name`), while trailing column entries match the current sequence of packages whose status equals `active`.
    - Uninitialized cell intersections are lazily populated with a default boolean configuration set to `false` on initial viewport execution.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click "Edit Matrix" | Switches `isEditMode = true`, converting fixed strings into editable inputs, unlocking row delete elements, and initializing category row drag states. |
    | 2. Click "Add Category" | Appends a category record container identified by `cat_[timestamp]` with a placeholder label "NEW CATEGORY". |
    | 3. Drag a Category Header row vertically | Shifts the category block position along with its underlying feature array children elements to new array indices. |
    | 4. Click "Add Feature" beneath a category block | Injects a child feature item into the parent category's `features` property array. |
    | 5. Update Matrix intersection cell variables | - **Clicking the circular Toggle element:** Switches binary `booleanValue` state representations (rendering green checkmarks for active features or gray minus bars for non-supported ones).  
    - **Editing text boxes:** Captures custom string metrics (e.g., "10 GB", "Unlimited") under the active language context. |
    | 6. Click "Save Matrix" | Passes the structured tree array to `handleUpdateComparisonCategories` to lock mutations and update persistence stores. |

### FR-07: Schema-Driven Matrix JSON Import

- **Description:** Allows bulk initialization of matrix structures by evaluating an uploaded `.json` map file.
- **Business Rules:** Input sources must terminate with `.json` extensions, and decoded data must resolve into a standard `ComparisonCategory[]` schema tree array.
- **Use Case Specification:** Clicking "Import JSON" triggers file selection controls. A FileReader instantiates and processes the document text stream. If structural integrity checks pass, the parsed schema binds directly onto the `categories` model signal, automatically pushing the interface into `isEditMode = true` for verification. Structural verification failures throw an browser alert notice.

## 3.5. Prototype

# 4. Non-Functional Requirements

- **Performance & Real-Time Responsiveness:** Form bindings and view state transitions run on Angular Signals reactive primitives, ensuring layout calculations, text mutations, and toggle updates complete under 100ms.
- **User Experience (UX) Enhancements:** All custom dragging events display clear translucent ghost tracks, change cursors to active grabbing variants (`cursor-grab` to `cursor-grabbing`), and color target drop borders (e.g., `border-t-blue-500`) to mark insertion destinations. Focus states are accented with distinct shadows (`focus:ring-4 focus:ring-blue-500/10`) to anchor user attention.
- **Data Isolation Lifecycle:** Deep serialization copies (`JSON.parse(JSON.stringify(...))`) are enforced during entity editing initialization. Unsaved mutations remain isolated to sandbox states until explicit "Save" intents commit mutations to application state services, discarding changes on "Cancel" to protect production data from corruption.