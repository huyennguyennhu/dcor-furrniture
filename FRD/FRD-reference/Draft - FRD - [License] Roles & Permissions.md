# 1. Overview

## 1.1. Purpose

This document defines the business and technical requirements for the Roles & Permissions feature within the XPERC administration portal. This feature enables the configuration of granular permissions and manages access control distribution across various system capabilities such as module management, license management, company management, user management, billing, and audit logs.

## 1.2. Scope

### 1.2.1. In-Scope Features

- **Roles & Permissions Dashboard Screen:** Displays an overview via statistical metric tiles (Total Roles, Total Permissions, Permission Categories) and a grid layout containing existing roles represented as cards.
- **View Role Permission Details:** Provides a quick view of all active permissions associated with a specific role through a modal popup window.
- **Create Role:** Allows the setup of a role name, its description, and granular permission selections categorized by Permission Categories.
- **Edit Role:** Updates the name, description, and assigned permissions of an existing role (excluding default system roles).
- **Delete Role:** Removes a role from the system backed by a safety constraint check that validates the number of administrators currently linked to the role.

### 1.2.2. Out-Scope Features

- The workflow for assigning administrative user accounts directly to specific roles (This is governed by the **Admin Management** feature).
- Module deployment, package bundling, and license registrations (These are handled within the **Module Registry** and **License Packages** modules).

# 2. User Story

### US-01: Roles & Permissions Management

> *As a **Super Admin**, I want to manage (View, Create, Edit, Delete) administration roles and system access permissions so that I can enforce security and accurately delegate operational responsibilities to team members.*
> 

**Acceptance Criteria**

- **Scenario 1.1: View existing roles and details of a default system role**
    - **Given:** The user is logged into the XCorp Admin system with `Super Admin` privileges and is navigating the "Roles & Permissions" module screen.
    - **When:** The user views the overall screen layout.
    - **Then:** The system must display 3 metric tiles: Total Roles, Total Permissions, and Permission Categories.
    - **And:** The system displays a grid containing roles.
    - **And:** The `Super Admin` role is the default and available role in the system.
    - **And:** For the system-defined role `Super Admin` (marked with a SYSTEM tag), the system must only display a detail view icon (eye icon) while hiding the Edit and Delete buttons. When clicking on the card, a modal popup appears to render a detailed view showing that all 28/28 permissions are toggled active (checked green states for View/Create/Edit/Delete Modules, Licenses, etc.).
- **Scenario 1.2: Successfully create a custom role**
    - **Given:** The user is on the "Roles & Permissions" screen.
    - **When:** The user clicks the "+ Create Role" button.
    - **Then:** The system displays a "Create Role" Modal containing the following fields: Role Name (Text input), Description (Text area), and a categorized list of Permissions (Module Management, License Management, etc.).
    - **When:** The user inputs all required fields, uses "Select All" or ticks specific permissions, and clicks "Save/Create".
    - **Then:** The system closes the modal, persists the records to the database, fires a success notification toast, and increments the "Total Roles" counter by 1 on the dashboard.
- **Scenario 1.3: Edit an active custom role**
    - **Given:** The user is on the main Roles dashboard layout.
    - **When:** The user clicks the Edit icon (pencil icon) on the `Operations Manager` card.
    - **Then:** The system pops up the "Edit Role" Modal pre-populating the Name, Description, and the exact state of all permission checkboxes matching that specific role's current data.
    - **When:** The user alters the permissions (e.g., deselects certain items inside the Module Management section) and clicks save.
    - **Then:** The system updates the selected permission count displayed on the role card (e.g., changes from `16 / 28` to the new figure) and instantly applies the updated permissions to all admins bound to this role.
- **Scenario 1.4: Delete a role currently assigned to other Admins**
    - **Given:** The role `Viewer` is currently linked to an active administrator account (`Admins with this role: 1`).
    - **When:** The user clicks the Delete icon (trash bin icon) on the `Viewer` card.
    - **Then:** The system triggers a confirmation warning modal: "Are you sure you want to delete the role 'Viewer'? There are 1 admin(s) using this role. They will need to be reassigned." paired with "Cancel" and "Delete" (red color) action buttons.
    - **When:** The user clicks "Delete".
    - **Then:** The system removes the role record, unbinds the role from the old admin accounts, and refreshes the dashboard view layout.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Description:** All operational procedures within this submodule require valid authentication and a high-level administrative account (`Super Admin`). Any execution that mutates backend state data (Create, Update, Delete actions) must be logged comprehensively into the system **Audit Logs**.
- **Constraints:**
    - Role Name Format: Maximum of 50 characters, forbidden from containing malicious characters to prevent SQL Injection vectors.
    - The system maintains a strict fixed set of **8 Permission Categories** encapsulating **28 Granular Permissions** (Total Permissions).
- **Standard Permission Matrix:** Each Permission Category consists of a maximum of 4 action permissions, uniformly defined with standard technical identifiers (System Keys) as follows:
    - **View (`[category].view`):** Grants access to the module interface, list views, search queries, data filters, and record detail views.
    - **Create (`[category].create`):** Allows opening creation forms, inputting data fields, and committing new records into the system database.
    - **Edit (`[category].edit`):** Allows opening modification forms, altering properties of an existing active record, and saving updates.
    - **Delete (`[category].delete`):** Allows executing a delete action (either a physical hard delete or a logical soft delete, depending on the object configuration) to remove a record from the active database.
- **Permission Dependency Constraint:** To execute **Create**, **Edit**, or **Delete** actions within any given category, a user **must explicitly possess the View permission** for that specific category.
    - *Example:* If a Role does not have the `View Modules` (`module.view`) permission checked, the system will automatically disable (or hide) the capability to interact with or select the `Create/Edit/Delete Module` checkboxes.
- **Applicable Scope:** This 4-core-permission rule is enforced systematically across all **8 active Permission Categories** in the platform:
    1. *Module Management* (`module.view`, `module.create`, `module.edit`, `module.delete`)
    2. *License Management* (`license.view`, `license.create`, `license.edit`, `license.delete`)
    3. *Company Management* (`company.view`, `company.create`, `company.edit`, `company.delete`)
    4. *User Management* (`user.view`, `user.create`, `user.edit`, `user.delete`)
    5. *Billing Management* (`billing.view`, `billing.create`, `billing.edit`, `billing.delete`)
    6. *Audit Logs Management* (`audit.view`, `audit.create`, `audit.edit`, `audit.delete`)
    7. *Admin Management* (`admin.view`, `admin.create`, `admin.edit`, `admin.delete`)
    8. *Role Management* (`role.view`, `role.create`, `role.edit`, `role.delete`)

## 3.2. Functional Requirements Details

### FR-01: Statistics Tracking and Roles List (Dashboard View)

- **Description:** Renders the central navigation cockpit of the Roles & Permissions module.
- **Business Rules:**
    - **KPI Metric Tiles:** Must continually calculate and display real-time numbers for Total Roles, Total System Permissions, and Permission Category counts.
    - **Role Card Layout:** Each role card displays: Role title, a system tag (if applicable), a short description, permission allocation progress (e.g., `16 / 28`), a group of category-specific indicator badges (e.g., `Module: 1/4`, `License: 4/4`, `Company: 5/5`...), and the count of administrators mapped to it (`Admins with this role`).
    - **System Role Protection:** The default `Super Admin` role is an immutable system configuration. The system must disallow and hide Edit and Delete controls for it.
- **Pre-conditions:** The user accesses the "Roles & Permissions" side menu item with a verified session.
- **Use Case Specification:**
    
    
    | User Action | System Behavior |
    | --- | --- |
    | 1. Click the "Roles & Permissions" menu item located on the left-side navigation rail. | The system queries the data layer and renders the main Dashboard containing the metrics block along with the 4 default cards: Super Admin, Operations Manager, Viewer, and Billing Admin. |
    | 2. Hover over or observe the Super Admin card. | The system exposes only the view details icon (eye icon), hiding both the Edit and Delete controls. |
    | 3. Hover over or observe other custom role cards (Viewer, Billing Admin...) | The system highlights the Edit (pencil) and Delete (trash bin) actions at the upper right corner of the respective card. |
- **Post-conditions:** User Interface accurate to the latest persisted state in the database.

### FR-02: View Role Permission Details (View Permissions Modal)

- **Description:** Displays a comprehensive read-only structural checklist breakdown of all active or inactive permissions bound to a targeted Role without making data mutations.
- **Business Rules:** Renders the permission schema inside an un-editable view state. Enabled items are marked with check icons. The structure reflects all categories: Module Management, License Management, Company Management, User Management, Billing Management, Audit Logs Management, Admin Management, and Role Management.
- **Pre-conditions:** The user is on the central Roles & Permissions dashboard dashboard screen.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click the `Super Admin` card background or its dedicated eye icon. | The system invokes a modal layout titled "Super Admin — Permissions" coupled with its description field. |
    | 2. Use the inner scrollbar to navigate the list down. | The system presents grouped permissions clearly (e.g., `Module Management [4/4]` containing View Modules, Create Module, Edit Module, and Delete Module all in green checked states). |
    | 3. Click the close "X" icon at the top right of the modal window. | The system dismisses the modal popup and reverts focus back to the parent Dashboard. |
- **Post-conditions:** No transactional changes are committed.

### FR-03: Create & Edit Role Configuration (Create & Edit Role Modal)

- **Description:** Provides a modal web form allowing the creation or modification of a role configuration via text field parameters and granular permissions checkbox structures.
- **Business Rules:**
    - **Validation Rules:** `Role Name` is a mandatory text string. The `Description` text block is optional.
    - **Mass Action Controls (Quick Actions):**
        - "Select All" global link: Checks every one of the 28 available permissions instantly.
        - "Clear" global link: Resets and deselects all permissions simultaneously.
        - Category-level "Select All / Deselect All" links: Scopes mass toggles exclusively to the corresponding container box (e.g., clicking "Select All" within Module Management activates its 4 dependent child actions).
    - **Counter Badges:** Renders live fractional indices indicating chosen item counts over total items inside a category header (e.g., `Module Management [1/4]`).
    - **Technical System Keys:** To the right side of each permission row description, a muted gray text indicator displaying the backend permission key string must be displayed (e.g., `module.view`, `module.create`, `module.edit`, `module.delete`).
- **Pre-conditions:** The administrator interacts with either the global "+ Create Role" button or a specific custom card's Edit trigger.
- **Use Case Specification (Context: Edit Role):**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click the pencil icon on the `Operations Manager` role card. | The system surfaces the "Edit Role" Modal window, maps current textual values into Name/Description text areas, and maps checkbox elements to their current state in the DB (e.g., `View Modules` checkbox is checked). |
    | 2. Toggle or adjust checkbox elements to alter access permissions. | The system calculates modifications in real-time, refreshing the global indicator count label (e.g., modifying "16 selected" to reflect the actual live count). |
    | 3. Click "Save" to commit or click "X" to terminate the session. | **On Cancel ("X"):** Closes modal without execution. **On Save:** Runs format validation checks, updates data persistence layers, closes modal layout, and triggers success prompt notifications. |
- **Post-conditions:** Role configuration structures are updated in the relational database. Authenticated admin users belonging to this role will observe changed system access behaviors during their subsequent operational loops or upon session token refresh.

### FR-04: Delete Role Execution (Delete Role)

- **Description:** Permanently drops an end-user-configured custom role definition from the system instance.
- **Business Rules:**
    - Operates exclusively against user-defined customized profiles. Default system templates such as `Super Admin` are locked against removal.
    - **Dependency Safeguard (Usage Constraints):** If an active admin configuration maps to the targeted role (`Admins with this role` > 0), the system must intercept the delete action with a clear Confirmation Dialogue calling out exactly how many user records are affected before unlocking the execution.
- **Pre-conditions:** The manager is navigating the Dashboard view and invokes the Delete control on an un-system-locked card.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Click the trash bin icon on a valid custom card target (e.g., `Viewer` role). | The system overrides focus with a "Delete Role" confirmation prompt outlining the exact count of linked active user accounts. |
    | 2. Click the "Cancel" action button. | Dismisses prompt layout, revokes execution pipeline, and protects data integrity. |
    | 3. Click the red "Delete" action button. | The system carries out a hard or logical delete cascade on the target database table row, drops associated user profile mapping linkages, drops the modal layout, and forces a dashboard counter decrement refresh (`Total Roles`). |
- **Post-conditions:** The role configuration record is fully removed from the active entity schemas.

## 3.3. Prototype

https://prototype-admin-a272b.web.app/

https://prototype-admin-a272b.web.app/

# 4. Non-Functional Requirements

- 

# Related Documents