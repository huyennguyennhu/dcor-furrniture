# Document History

| Version | **Date** | **Author** | **Changes** |
| --- | --- | --- | --- |
| 1.0 | 4 tháng 3, 2026  | HANH NGUYEN | Create Document |
| 2.0 | 14 tháng 4, 2026  | HANH NGUYEN | add FR-06
update FR-01, FR-02, FR-03 |
| 3.0 | 16 tháng 4, 2026  | HANH NGUYEN |   • Reorder and show/hide Module Info of License in Pricing page
  • Adding sub-feature status |

# 1. Overview

## 1.1. Purpose

This document details the functional requirements for the Module Registry sub-module. The objective is to provide a tool for the System Administrator to manage the Module catalog, define Sub-features, configure marketing metadata, and establish basic technical parameters.

## 1.2. Scope

### 1.2.1. In-Scope Features

- **Module List Management:** View, Search, and Filter modules.
- **Module Registration:** Create new modules and set basic configurations such as Billing Type, Status, and Base Price.
- **Sub-feature Definition:** Define and manage Sub-features (Core vs. Add-on).
- **Metadata Configuration:** Configure Marketing Name, Description, and Icons.
- **Release Status Management:** Set release stages (Public, Beta, Internal).

### 1.2.2. Out-Scope Features

- **Packaging Modules:** Combining modules into Licenses (part of the License Packages module).
- **Subscription Management:** Managing subscriptions and assigning licenses to Tenants.
- **Billing & Invoicing:** Processing payments and generating invoices.

# 2. User Story

### US-01: Module Catalog Management

> *As a System Administrator, I want to access the Module Registry to view, search, and manage all existing modules within the system.*
> 

**Acceptance Criteria**

- **Scenario 1.1: Search and Filter Modules**
    - **Given:** The User is on the **Module Registry** list page.
    - **When:** The User enters a **module name/ID** or filters by status (All, Public, Beta, Internal).
    - **Then:** The system displays a list of modules matching the search criteria.
- **Scenario 1.2: View Module Details**
    - **Given:** The User finds the target module in the list.
    - **When:** The User clicks on the module name.
    - **Then:** The system displays configuration details, the base price, and the list of associated sub-features.

### US-02: Create and Configure New Module

> *As a System Administrator, I want to register a new module from the technical backend and set marketing information to prepare it for license packaging.*
> 

**Acceptance Criteria**

- **Scenario 2.1: Successful Module Creation**
    - **Given:** The User selects the "**Create a new module**" function.
    - **When:** The User enters the **Marketing Name**, **Description**, selects the **Module Code** (to map with the backend), and sets the **Billing Type** and **Base Price**.
    - **Then:** The system saves the new module with the selected or default status.
- **Scenario 2.2: Define Sub-features for a Module**
    - **Given:** The User is in the module creation/editing flow.
    - **When:** The User selects sub-features from the technical list and assigns a **Marketing Name/Description** to each.
    - **And:** The User define whether this sub-feature is a core feature or an add-on feature.
    - **Then:** The sub-features are strictly linked to the parent module.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Authentication & Authorization:** The content a user is allowed to access depends on their permissions.
- **Data Validation:**
    - **Module Code** must be unique.
    - **Base Price** cannot be a negative value.
- **Audit Logging:** Every Create, Edit, or Delete action for a module/sub-feature must be logged (Who, When, Old Value, New Value).

## 3.2. Functional Requirements Details

### FR-01: Module List Management

- **Description:** Provides a card-based list interface that displays all modules currently in the system alongside search tools and quick filters. This interface gives the User an overview of the commercial configuration (price, billing) and technical setup (features) for each module.
- **Business Rules:**
    - **Default Display:** The system displays all modules in the Registry by default.
    - **Release Status:** Modules are categorized and filtered into three main statuses:
        - **Public:** Available to all customers.
        - **Beta:** Available only to whitelisted testing groups (early adopters).
        - **Internal:** Used for internal purposes only.
    - **UPDATE 16 tháng 4, 2026** The release status will affect the accessibility and visibility of the module for each company type (view details in FR-06).
    - **Built-in Logic:** Modules marked as "Built-in" are automatically included in every license package and cannot be disabled.
    - **Information Density:** Each module card must display the following information:
        - **Icon** (or Initial), **Marketing Name**, **Module Code**, and **Status** label.
        - A short **Description** of the module’s functionality.
        - A list of currently applied **Billing Types**.
        - A list of associated **Features** (sub-features).
        - The **Base Price** in **$/user/mo**.
- **Pre-conditions:** The user has successfully logged in and has access.
- **Use Case Specification:**
    
    
    | User Action | System Behavior |
    | --- | --- |
    | Access the "**Module Registry**" menu | The system retrieves the data and displays the module list interface along with instructional header text. |
    | Enter keywords in the "**Search modules...**" bar | **UPDATE 14 tháng 4, 2026** The system filters data in real-time ~~or upon pressing Enter~~ based on the **Module Name** or **Module Code**. |
    | Click the filter tabs (All, Public, Beta, Internal) | The system updates the list to display only the modules belonging to the selected status. |
    | Click the **Pencil (Edit)** icon on a module card | The system opens the **Edit Module** interface to modify the current configuration of that specific module. |
    | Click the "**Create Module**" button | The system opens the "**Create New Module**" pop-up modal to register a new module. |

### FR-02: Module Registration (Create New Module)

- **Description:** Allows the User to declare a new module by mapping it to a technical "**Module Code**" and defining its commercial metadata and billing rules.
- **Business Rules**
    - **Module Code (Key):** This is a mandatory dropdown. Selecting a code is a prerequisite for adding features, as it determines the technical scope of the module.
    - **Built-in Module Toggle:** If enabled (On), this module is automatically included in every license generated by the system.
    - **Billing Types:** Supports multi-selection. User can select one or more metrics: *Per Seat, AI Tokens, Automation Runs, Data Storage, or Concurrent Sessions.*
    - **Feature Loading:** The "**Features**" dropdown remains disabled or empty until a **Module Code** is selected.
- **Use Case Specification:**
    
    
    | User Action | System Behavior |
    | --- | --- |
    | Click **"Create New Module"** button | Opens the creation pop-up modal. |
    | Select a **Module Code** | Enables the **Features** selection section and filters available features based on the chosen code. |
    | Select a feature and click **"+"** | Adds the feature to the list below. By default, it is assigned the **CORE** status. |
    | Click **"Create Module"** | Validates all mandatory fields, saves data to the DB, and displays a success notification. |
- **UI Fields**
    
    
    | Field Name | UI Component | Data Type | Mandatory | Values | Default Value | Constraints / Logic |
    | --- | --- | --- | --- | --- | --- | --- |
    | Marketing Name | Text Input | String | Yes |  | Empty |   • Supports multi-language input (EN/VN).
      • If one language is blank, display blank (No fallback to the other language). |
    | Module Code | Dropdown | String (ID) | Yes |  | "Select module code..." | Contains technical identifiers (e.g., `mod_crm`). Once selected, the system loads the corresponding Feature list. |
    | Base Price | Number Input | Decimal | Yes |  | 0 | Unit: `$/User/Month`. Value must not be negative. |
    | Built-in Module | Toggle Switch | Boolean | No |  | Off | If "On," this module is automatically included in every generated license. |
    | Description | Text Area | String | No |  | Empty | General overview of the module for marketing purposes. |
    | Status | Dropdown | Enum | Yes |   • Public
      • Beta
      • Internal | "Public" |  |
    | Icon ~~URL~~ | Text Input | ~~String (URL)~~
    File Upload | No |  | Empty | ~~Link to the icon file stored on the server/cloud.~~
    **UPDATE 14 tháng 4, 2026** Validates format (PNG/SVG) and max size. |
    | Billing Types | Multi-selection | List | Yes |   • Per Seat
      • AI Tokens,
      • Automation Runs
      • Data Storage
      • Concurrent Sessions | "Per Seat" | Allows multiple selection |
    | Features Search | Dropdown + Button | List | No |  | "Select a feature to add..." | Only enabled after a **Module Code** is selected. Click the **"`+`"** button to add the feature to the list below. |

### FR-03: **Sub-feature Definition (Feature Management)**

- **Description:** Manages individual functionalities within a module, allowing the User to define which features are mandatory and which are optional for customers.
- **Business Rules**
    - **Default Type:** All newly added features are set to **CORE** by default.
    - **Type Transition:** Clicking the **CORE/ADD-ON** tag toggles the feature type.
    - **Confirmation Modal:** Changing a feature from **Core** to **Add-on** triggers a confirmation pop-up: "Are you sure you want to change this feature from Core to Add-on? Please confirm that this change has been agreed upon with the development team.".
    - **Sub-feature Metadata:** Each added feature has its own **Feature Code** (**read-only**) and a **Description** field for specific marketing details.
    - **UPDATE 16 tháng 4, 2026 Release Status:** The sub-feature will be in one of the following states:
        - **Public:** Available to all customers.
        - **Beta:** Available only to whitelisted testing groups (early adopters).
        - **Internal:** Used for internal purposes only.
            
            **Logic Matrix Table: Release Status of Module × Release Status of Sub-feature**
            
            |  | Public Module | Beta Module | Internal Module |
            | --- | --- | --- | --- |
            | **Public Sub-feature** | yes | no | no |
            | **Beta Sub-feature** | yes | yes | no |
            | **Internal Sub-feature** | yes | yes | yes |
    - **Feature Classification**
        - **CORE:** Mandatory feature; always enabled if the module is active.
        - **ADD-ON:** Optional feature; can be toggled or sold as an extra component in the License Packages.
- **Post-conditions:** Defined features and their types (Core vs. Add-on) are saved and become available for selection during the **Dynamic Packaging** phase.
- **UPDATE 16 tháng 4, 2026 UI Fields**
    
    
    | Field Name | UI Component | Data Type | Editable | Constraints / Logic |
    | --- | --- | --- | --- | --- |
    | Feature Name | Label | String | Yes | Displays the marketing name of the feature based on the selected **Feature Code**. |
    | Feature Type | Tag / Toggle | Enum | Yes | Defaults to **CORE**. Click to switch to **ADD-ON**. Switching from **Core** to **Add-on** requires confirmation via a Modal. |
    | Feature Code | Text Input | String | No (Read-only) | Unique technical code of the feature (e.g., f_crm_contact). |
    | Description | Text Area | String | Yes | Allows the User to enter a detailed description for each specific sub-feature. |
    | Action | Icon Button | N/A | Yes | "**Trash bin**" icon button to remove the feature from the current module. |
    | Release Status | Dropdown | Enum | Yes | Include 3 status: Public, Beta, Internal |

### FR-04: Module Configuration Update & Deletion

- **Description:** Provides the ability to update marketing information, adjust commercial configurations, or remove unused modules from the system. This function ensures that data remains accurate and synchronized with product changes from both business and technical perspectives.
- **Business Rules:**
    - **Configuration Update**
        - **Access Point:** The User clicks the **Pencil (Edit)** icon on the module card within the **Module Registry** interface to open the editing modal.
        - **Read-only Fields:** The **Module Code** (Technical Identifier) is locked after initialization to prevent breaking links with backend services and the billing engine.
        - **Feature Type Change:** When changing a **Sub-feature** from **Core** to **Add-on**, the system must display a confirmation warning modal regarding the impact on operational logic.
        - **Audit Logging:** All changes to pricing, status, or feature configurations must be permanently recorded in the **Audit Log** (Who changed it? What was changed? Old vs. New values).
    - **Module Deletion**
        - **Data Integrity (Reference Check):** The system performs a reference check before allowing a deletion
        - **Deletion Rejection Criteria:** A module cannot be deleted if it is linked to any **Active License** (currently on sale) or Active Subscription (currently in use by a customer).
        - **Alternative Solution:** If deletion is blocked due to data constraints, the User may switch the **Status** to **Internal** or **Beta** to hide the module from the public list without disrupting existing customer services.
- **Use Case Specification**
    
    
    | User Action | System Behavior |
    | --- | --- |
    | Click the **Edit** icon on a module card. | Displays the modal pre-filled with the module's current data. |
    | Modify price or status and click "**Update Module**". | Validates data → Logs Audit Trail → Updates DB → Displays success notification. |
    | Attempt to delete a module currently used by a customer. | System displays error: "Cannot delete module. This module is in use by active subscriptions". |
- **UI Fields (Update Mode)**
    
    
    | Field Name | UI Component | Editable | Constraints / Logic |
    | --- | --- | --- | --- |
    | Marketing Name | Text Input | Yes | Updates the display name shown to customers. |
    | Module Code | Dropdown | No | Displayed as Read-only to protect system integrity. |
    | Base Price | Number Input | Yes | Changes the base price; requires logging of old/new values. |
    | Built-in Module | Toggle | Yes | Updates the default inclusion attribute of the module. |
    | Status | Dropdown | Yes | Changes accessibility (Public, Beta, Internal). |
    | Feature List | List | Yes | Add/Remove features or toggle Core/Add-on (requires confirmation). |

### FR-05: Error Messages & User Feedback

- **Description:** This requirement specifies the error messages and system feedback mechanisms intended to ensure data integrity, assist User in accurate data entry, and prevent unintended changes that could disrupt system operations.
- **Inline Validation Errors:** When the user clicks the "**Create Module**" button without completing mandatory fields, the system performs the following:
    - Changes the Input border color to **Red**.
    - Displays a "**Required**" label in red text directly below the field.
    - If **Base Price** fields is entered negative value, display the label “**Must be ≥ 0**” in red text below the data field.
- **System Logic Errors:**
    - If User deletes a module linked to an **Active License** or **Active Subscription**, the system displays a dialog message: "Cannot delete module. This module is currently linked to an Active License or Subscription."
- **Confirmation & Warning Dialogs:** User confirmation is required for actions that significantly impact product configurations.
    - Change **Feature Type** (Core to Add-on):
        - Title: "Change Feature Type".
        - Content: "Are you sure you want to change this feature from Core to Add-on? Please confirm that this change has been agreed upon with the development team.".
        - Actions: `[Cancel]` | `[Yes, Change to Add-on]`.
- **Display Rules**
    - **Inline Error:** Displayed directly below the field in error using red text (standard UI color code) to guide the user toward immediate correction.
    - **Toast Notification:** Displayed in the corner of the screen for success messages (e.g., "Module created successfully!") or unforeseen system errors (Timeout, Server Error).
    - **Modal Warning:** Used for high-impact business logic changes (e.g., toggling feature types) to force user acknowledgement before proceeding.

### UPDATE 14 tháng 4, 2026 FR-06: Module Registry & Visibility Logic

- **Description:** Manage the module catalog and visibility rules based on company (tenant) classification.
- **Business Rules:**
    - **Visibility Matrix:** Access and visibility rights for a Module are determined by the matrix table between Company Type and Module Status.
        
        **Matrix Table: Company Type × Module Status**
        
        | Company Type | Public Module | Beta Module | Internal Module |
        | --- | --- | --- | --- |
        | **External Company** | yes | no | no |
        | **Beta Company** | yes | yes | no |
        | **Internal Company** | yes | yes | yes |
    - **Assignment Flexibility**: The system allows the Administrator to assign any License (even those containing Public, Beta, or Internal modules) to an **External** company without blocking the action during the configuration step.
    - **Runtime Entitlement Logic (Hiding Logic)**:
        - At the time the end-user accesses the system (Runtime), the system must check the user's **Company Type**.
            - If a module with **Beta** or **Internal** status is included in the assigned License but the company is classified as **External**, the system must completely **Hide** that module from the user interface (Sidebar).
    - **Status Impact**: When an Administrator changes the status of a module (e.g., from **Beta** to **Public**), the system must immediately update the visibility rights for all **External Companies** holding a License that contains this module.
    - **Data Integrity Check**: Hiding a module based on matrix logic must not affect the structure of the License record stored in the Database; it only impacts the display layer and actual access rights.
    - On the Pricing page, show/hide the Module infomation depend on the visibility management `show_on_pricing` (view details in FR-07).

### UPDATE 16 tháng 4, 2026 FR-07: Module Display & Visibility Management on Pricing page

- **Description:** Allows the Administrator to reorder and configure the visibility (show/hide) of Modules on the Pricing Page.
- **Business Rules**
    - **Interface:** Displays the list of all Modules as interactive rows.
    - **Show on Pricing (Checkbox):**
        - If **Checked**: The Module will be displayed on the Pricing page, `show_on_pricing = true`
        - If **Unchecked**: The Module will be hidden from the Pricing page; however, this does not affect its system status (Internal/Public), `show_on_pricing = false`
        - Supports an "**Select all**" button at the top of the list for quick bulk deselection.
    - **Reorder Logic for all Module (Drag & Drop):**
        - The admin uses drag-and-drop to change the position.
        - This order will determine the order in which the Modules appear on the Pricing page.
    - The display order and visibility status are updated after the Administrator clicks the "**Apply**" button and system will display a notification: "Display order updated successfully!”
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | Click **"Display Settings"** icon | Opens a Modal displaying the comprehensive list of Module names with checkboxes and drag handles. |
    | Drag and drop Module A above Module B | Temporarily updates the display position of Module A within the list interface. |
    | Click/Unclick Checkbox to the left of a Module | Updates the pending visibility status for that specific Module on the Pricing Page. |
    | Click **"Apply"** | Persists the index (order) and new visibility status to the Pricing page. |
- **UI Fields (Modal Management):**
    
    
    | **Field Name** | **UI Component** | **Data Type** | **Editable** | **Constraints / Logic** |
    | --- | --- | --- | --- | --- |
    | **Show on Pricing page** | Checkbox | Boolean | Yes | Located to the left of the Module Name. |
    | **Module Name** | Label | String | No | Displays the **Marketing Name** of the Module. |
    | **Reorder Handle** | Icon (6-dot) | N/A | Yes | Used to perform the drag-and-drop interaction. |

## 3.3. Prototype

https://prototype-admin-a272b.web.app/

https://prototype-admin-a272b.web.app/

# 4. Non-Functional Requirements

- **Latency:** Metadata retrieved from the Registry and cached via Redis for entitlement checks must have a latency of < 20ms.
- **Reliability:** The system must ensure data consistency between the Registry and License Definition records.
- **Auditability:** Maintain a permanent history of module configurations for auditing purposes.

# Related Documents

Document - Modules and License Management