# Document History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | October 5, 2026 | HANH NGUYEN / XPERC BA Team | Initial creation of production-grade FRD for Roles & Permissions |
| 2.0 | October 5, 2026 | XPERC BA Team | Expanded Acceptance Criteria, UI Specifications, Error Messaging, Permission Dependencies, and Multi-language support |
| 3.0 | October 5, 2026 | XPERC BA Team | Updated Prototype adjustments ✏️ and added proposed User Stories tagged with `(🙌 Proposed - Not yet on prototype)` |

---

# 1. Overview

## 1.1. Purpose
This document defines the functional and business requirements for the **Roles & Permissions** module within the **XPERC License Management System**. This feature provides System Administrators with a centralized, granular Access Control System (RBAC - Role-Based Access Control) to manage administrative roles, configure fine-grained system access rights, enforce security boundaries, and ensure complete operational accountability across all platform capabilities (Modules, Licenses, Companies, Billing, Audit Logs, Admins, and Roles).

## 1.2. Scope

### 1.2.1. In-Scope Features
- **Roles & Permissions Cockpit (Dashboard):** Real-time KPI statistics tiles (Total Roles, Total Permissions, Permission Categories) and card-based grid layout displaying all active system and custom roles.
- **Search & Filter Roles Grid (🙌 Proposed - Not yet on prototype):** Text-based search filter by role name/description and status filter.
- **View Role Permission Details (Modal):** Read-only inspection popup displaying complete permission allocation trees upon clicking card body or View Eye icon.
- **Create Custom Role (Modal & Form):** Interactive creation wizard supporting role naming (unique constraint), descriptions, smart category-level `Select All` / `Deselect All` toggles.
- **Edit Custom Role (Modal & Form):** Real-time updates via `Update Role` button ✏️ with immediate propagation to mapped administrators.
- **Delete Custom Role:** Controlled removal of non-system roles protected by active admin count dependency checks and reassignment warnings.
- **Active / Inactive Role Status Toggle (🙌 Proposed - Not yet on prototype):** Capability to toggle role visibility without data deletion.
- **Permission Hierarchy & Dependency Enforcement (🙌 Proposed - Not yet on prototype):** Auto-disabling/enabling dependent child actions (Create/Edit/Delete require View).
- **Data-Level Scope Restrictions (🙌 Proposed - Not yet on prototype):** Configuring Company Type, Product Domain, and Geographic Region data access limits for internal admin teams.
- **Duplicate / Clone Role Utility (🙌 Proposed - Not yet on prototype):** One-click cloning of existing roles.
- **System Role Templates (🙌 Proposed - Not yet on prototype):** Pre-built functional role templates (Auditor, Billing Manager, Support Specialist).

### 1.2.2. Out-Scope Features
- User-to-Role Assignment Workflows (Managed under the **Admin Management** module).
- Tenant End-User Role Assignment within individual customer organizations (Managed under the **Companies / User Assignment** module).
- Entitlement Verification Guard Enforcement Engine (EMS Middleware core logic).

---

# 2. User Story & Acceptance Criteria

## US-01: View Administrative Roles and Permission Cockpit
> *As a **Super Admin**, I want to view an intuitive dashboard of all system and custom roles with summary metrics, so that I can quickly assess administrative access control distribution.*

### Acceptance Criteria
- **Scenario 1.1: Dashboard Initialization & KPI Render ✏️**
  - **Given:** The Super Admin navigates to the "Roles & Permissions" module from the sidebar.
  - **When:** The screen loads successfully.
  - **Then:** The system displays 3 KPI summary tiles:
    1. **Total Roles:** Total count of active roles in DB, including System Roles (`isSystem = true`, e.g. `Super Admin`) + Custom Roles created by Admins (`isSystem = false`). ✏️
    2. **Total Permissions:** Fixed system count of 28 granular permissions (`state.permissions().length`). ✏️
    3. **Permission Categories:** Fixed count of 8 system categories (`permissionCategories.length`). ✏️
  - **And:** Renders a responsive grid of Role Cards matching current database records.

- **Scenario 1.2: System Role Protection & Action Icons ✏️**
  - **Given:** The user views the `Super Admin` role card (`isSystem = true`).
  - **When:** Observing the card controls.
  - **Then:** The card displays an amber **SYSTEM** badge ✏️ (`bg-amber-100 text-amber-700`).
  - **And:** Displays exclusively a "View Permissions" (eye) icon ✏️ on the header of the `Super Admin` card, hiding Edit (pencil) and Delete (trash) buttons to protect system roles. ✏️
  - **And:** For Custom Roles (`isSystem = false`), the card header displays Edit (pencil) ✏️ and Delete (trash) ✏️ icons. Clicking anywhere on the card body triggers the read-only View Role Modal. ✏️

- **Scenario 1.3: Detailed Card Content Breakdown ✏️**
  - **Given:** Super Admin inspects role cards on the Dashboard grid.
  - **Then:** Each card renders:
    1. **Header:** Shield/Crown icon, Role Name, System Badge (if applicable), Short Description. ✏️
    2. **Action Icons:** View Eye Icon (System Roles) or Edit Pencil + Delete Trash Icons (Custom Roles). ✏️
    3. **Permissions Summary:** Fractional progress indicator (e.g. `16 / 28`). ✏️
    4. **Category Badges:** Rounded pills listing active categories with counts (e.g. `📦 Module: 4/4`, `💳 Billing: 2/4`...). Highlights in emerald green if 4/4, blue if 1-3/4. ✏️
    5. **Footer:** Mapped Admin Counter (`Admins with this role: X`). ✏️

- **Scenario 1.4: Search and Filter Roles List (🙌 Proposed - Not yet on prototype)**
  - **Given:** The Super Admin is on the Roles Dashboard containing multiple custom roles.
  - **When:** The Admin types a keyword into "Search roles..." or selects filter tabs (`All`, `System Roles`, `Custom Roles`).
  - **Then:** The system filters and renders matching role cards in real-time.

---

## US-02: View Detailed Role Permission Allocation
> *As an **Administrator**, I want to inspect the exact permission tree assigned to any role in a read-only view, so that I can audit role capabilities without risking data mutation.*

### Acceptance Criteria
- **Scenario 2.1: Launch Read-Only Permission Detail Modal ✏️**
  - **Given:** The Admin is on the Roles Dashboard.
  - **When:** The Admin clicks the "Eye" icon (on Super Admin card) or clicks the Card Body of any custom role. ✏️
  - **Then:** The system opens the "Role Permission Details" Modal (`[Role Name] — Permissions`) displaying:
    - Role Name, System/Custom Badge, and Description.
    - Category-level progress indicators (e.g. `Module Management: 4/4`).
    - Read-only list: Green `check-circle` icons on `bg-emerald-50` background for enabled permissions, gray `x-circle` icons for disabled ones. ✏️
    - **Permission Name & Business Description:** Displays human-readable label (e.g. "View Licenses") and description text. Muted technical keys like `module.view` are NOT shown in this view modal to maintain user readability. ✏️

---

## US-03: Create New Custom Administrative Role
> *As a **Super Admin**, I want to create custom operational roles with tailored permission subsets, so that I can delegate operational responsibilities securely according to principle of least privilege.*

### Acceptance Criteria
- **Scenario 3.1: Open Creation Form & Seed Initial State ✏️**
  - **Given:** The Super Admin is on the Roles Dashboard.
  - **When:** Clicks the **"+ Create Role"** button on the top toolbar.
  - **Then:** The system opens the "Create Role" Modal with:
    - Empty "Role Name" (Text input, mandatory, **unique constraint**). ✏️
    - Empty "Description" (Textarea, optional).
    - All 28 permission checkboxes set to unchecked by default (`0 selected`).
    - Global "Select All" and "Clear" mass-toggle links. ✏️
    - Category-level smart toggles that dynamically switch between **`Select All`** and **`Deselect All`** based on selection state. ✏️

- **Scenario 3.2: Enforce Permission Dependency Rules (🙌 Proposed - Not yet on prototype)**
  - **Given:** The Admin is configuring permissions in the Create/Edit Modal.
  - **When:** The `View` permission for a category (e.g., `View Licenses`) is **unchecked**.
  - **Then:** The system automatically unchecks and disables (locks) the `Create License`, `Edit License`, and `Deactivate License` checkboxes. (🙌)
  - **When:** The Admin checks any child permission (`Create`, `Edit`, or `Deactivate`), the system automatically checks the prerequisite `View` permission. (🙌)

- **Scenario 3.3: Submit Valid Custom Role Creation ✏️**
  - **Given:** The Admin has entered a unique Role Name ("Support Specialist"), description, and selected desired permissions. ✏️
  - **When:** Clicks the **"Create Role"** button ✏️.
  - **Then:** The system validates inputs (Name not empty, at least 1 permission selected), saves new role to DB, **logs Audit Log entry** ✏️, fires success toast ("Role 'Support Specialist' created"), increments "Total Roles" KPI by 1, and appends the new card to the grid.

---

## US-04: Edit Active Custom Role
> *As a **Super Admin**, I want to update existing custom role names, descriptions, and permission allocations, so that administrative permissions adapt to evolving operational needs.*

### Acceptance Criteria
- **Scenario 4.1: Populate Existing Role Data for Editing ✏️**
  - **Given:** The Super Admin clicks the Edit (pencil) icon on a custom role card (e.g. `Billing Admin`). ✏️
  - **When:** The "Edit Role" Modal surfaces.
  - **Then:** Pre-populates Role Name, Description, and active permission checkbox states.
  - **And:** Displays muted font-mono technical keys (e.g. `license.view`, `license.create`) on the right side of each permission row for technical reference. ✏️

- **Scenario 4.2: Commit Edits and Propagate Permissions ✏️**
  - **Given:** The Admin modifies permission selections and clicks **"Update Role"** ✏️.
  - **When:** Validation succeeds.
  - **Then:** Commits changes to DB, updates card progress count (e.g. `12 / 28`), logs Audit Log entry ✏️, and applies updated permissions to all assigned admins.

- **Scenario 4.3: Real-Time Session Invalidation Broadcast (🙌 Proposed - Not yet on prototype)**
  - **Given:** An active Admin user is currently logged in under the `Billing Admin` role.
  - **When:** Super Admin edits `Billing Admin` and revokes permissions.
  - **Then:** Broadcasts SSE revocation event within **< 1 second**, displaying toast warning and redirecting the Admin if currently on a revoked page. (🙌)

---

## US-05: Delete Custom Administrative Role
> *As a **Super Admin**, I want to remove obsolete custom roles with safety confirmation checks, so that the role catalog remains clean without disrupting active admin accounts.*

### Acceptance Criteria
- **Scenario 5.1: Block Instant Delete for Assigned Roles ✏️**
  - **Given:** Role `Auditor` is currently assigned to 2 active Admin accounts (`Admins with this role: 2`).
  - **When:** The Super Admin clicks the Trash icon on the `Auditor` card. ✏️
  - **Then:** Intercepts action and displays Warning Confirmation Modal ("Delete Role"):
    > *"Are you sure you want to delete the role 'Auditor'? There are 2 admin(s) using this role. They will need to be reassigned."*
  - **And:** Provides **[Cancel]** and **[Delete]** (Red button) controls. ✏️

- **Scenario 5.2: Execute Role Deletion ✏️**
  - **Given:** The Super Admin clicks **[Delete]** ✏️ in confirmation modal.
  - **When:** Request processes.
  - **Then:** Removes role record, unbinds linked admin accounts (reassigning to first available system role), logs Audit Log entry ✏️, fires toast notice ("Role 'Auditor' deleted"), decrements KPI counter, and removes card from dashboard.

- **Scenario 5.3: Reassign Admins Before Deletion (🙌 Proposed - Not yet on prototype)**
  - **Given:** Admin views Delete Role confirmation modal for a role with mapped admins.
  - **When:** Toggles `[x] Reassign affected admins to another role (🙌)` checkbox.
  - **Then:** Target Role dropdown appears. Buttons change to **`[Cancel]`** and **`[Delete & Reassign] (🙌)`**. Automatically transfers admins to target role upon deletion.

---

## US-06: Configure Data-Level Access Scopes (🙌 Proposed - Not yet on prototype)
> *As a **Super Admin**, I want to constrain custom roles by Data Scopes (Company Type, Product Domain, Region), so that internal admin teams can only manage data within their assigned domain.*

### Acceptance Criteria
- **Scenario 6.1: Define Data Scope Boundaries**
  - **Given:** Super Admin is creating or editing a custom role (e.g. "Vietnam Beta Support").
  - **When:** Expands **"Data Scope Settings (🙌)"** section.
  - **Then:** Selects `Company Type = Beta`, `Domain = xcorp.app`, and `Region = VN`.
  - **When:** Saves role.
  - **Then:** Persists scope parameters in DB.

- **Scenario 6.2: Enforce Server-Side Data Scope Isolation**
  - **Given:** Admin with "Vietnam Beta Support" role attempts to view an External or US company.
  - **When:** Executing API request or navigating UI.
  - **Then:** System blocks access with HTTP 403 Forbidden alert banner.

---

## US-07: Duplicate / Clone Existing Role (🙌 Proposed - Not yet on prototype)
> *As a **Super Admin**, I want to duplicate an existing role card with 1-click, so that I can rapidly create similar roles without checking 28 permissions from scratch.*

### Acceptance Criteria
- **Scenario 7.1: Clone Role Permission Matrix**
  - **Given:** Super Admin is on Roles Dashboard.
  - **When:** Clicks **"Duplicate" (Copy icon) (🙌)** on `Operations Manager` card.
  - **Then:** Surfaces Create Role Modal pre-filled with Name `"Copy of Operations Manager"` and exact permission checkbox configurations.
  - **When:** Admin changes name and saves.
  - **Then:** Creates new custom role in DB.

---

## US-08: Seed Role from Standard System Templates (🙌 Proposed - Not yet on prototype)
> *As a **Super Admin**, I want to select from pre-built Role Templates when creating a role, so that standard operational roles follow industry best practices.*

### Acceptance Criteria
- **Scenario 8.1: Select System Role Template**
  - **Given:** Admin clicks "+ Create Role".
  - **When:** Selects **"Load from Template (🙌)"** dropdown.
  - **Then:** Displays standard options: *Compliance Auditor*, *Billing Operations*, *Product Support Specialist*.
  - **When:** Selects *Compliance Auditor*.
  - **Then:** Auto-checks all 8 `View` permissions while keeping `Create/Edit/Delete` unchecked.

---

## US-09: Grant Time-Bound Temporary Access (🙌 Proposed - Not yet on prototype)
> *As a **Super Admin**, I want to assign temporary elevated roles with an automated expiration timer, so that emergency support or debugging access is automatically revoked.*

### Acceptance Criteria
- **Scenario 9.1: Configure Temporary Access Timer**
  - **Given:** Super Admin is assigning a role in Admin Management.
  - **When:** Enables **"Temporary Access (🙌)"** toggle and selects expiry datetime.
  - **Then:** Records `expires_at` timestamp.

- **Scenario 9.2: Automated Access Revocation Upon Expiration**
  - **Given:** Temporary access reaches expiration timestamp.
  - **When:** Background worker evaluates active grants.
  - **Then:** System revokes temporary role, reverts user to base role, and logs `TEMP_ACCESS_EXPIRED` in Audit Log.

---

# 3. Functional Requirements

## 3.1. Common Requirements
- **Authentication & Authorization:** Access restricted to `Super Admin` or users with `role.view`, `role.create`, `role.edit`, `role.delete`.
- **Audit Log Logging ✏️:** Transactional mutations logged permanently in Audit Log (Timestamp, User ID, Action Type, Target Role ID, Old/New Values).
- **Fixed Permission Taxonomy:** Immutable set of **8 Categories** containing **28 Permissions**:

| # | Permission Category | System Key Base | Included Granular Permissions |
|---|---|---|---|
| 1 | **Module Management** | `module` | `module.view`, `module.create`, `module.edit`, `module.delete` |
| 2 | **License Management** | `license` | `license.view`, `license.create`, `license.edit`, `license.delete` |
| 3 | **Company Management** | `company` | `company.view`, `company.create`, `company.edit`, `company.delete` |
| 4 | **User Management** | `user` | `user.view`, `user.create`, `user.edit`, `user.delete` |
| 5 | **Billing Management** | `billing` | `billing.view`, `billing.create`, `billing.edit`, `billing.delete` |
| 6 | **Audit Logs Management** | `audit` | `audit.view`, `audit.create`, `audit.edit`, `audit.delete` |
| 7 | **Admin Management** | `admin` | `admin.view`, `admin.create`, `admin.edit`, `admin.delete` |
| 8 | **Role Management** | `role` | `role.view`, `role.create`, `role.edit`, `role.delete` |

---

## 3.2. UI Fields & Specification Matrix

| Field Name | UI Component | Data Type | Mandatory | Default | Constraints & Business Logic |
| --- | --- | --- | --- | --- | --- |
| **Role Name** | Text Input | String | Yes | Empty | Max 50 chars. **Must be unique across active roles** ✏️. |
| **Description** | Textarea | String | No | Empty | Max 255 chars. Operational scope summary. |
| **System Role Flag** | Badge Pill | Boolean | System | False | `True` for Super Admin (`bg-amber-100 text-amber-700` ✏️). Hides Edit/Delete. |
| **Category Select All / Deselect All ✏️** | Button Toggle | Action | No | N/A | Toggles between `Select All` and `Deselect All` based on count ✏️. |
| **Granular Permission** | Checkbox | Boolean | No | False | Paired with technical key. Enforces View dependency 🙌. |
| **Search Roles Input (🙌)** | Text Search | String | No | Empty | Real-time filtering of role cards on Dashboard. |
| **Company Type Scope (🙌)** | Multi-Select | Enum List | No | `All` | Options: `All`, `External`, `Beta`, `Internal`. |
| **Product Domain Scope (🙌)** | Multi-Select | Enum List | No | `All` | Options: `All`, `xcorp.app`, `syrix.ai`. |
| **Geographic Region Scope (🙌)** | Dropdown | Enum | No | `Global` | Options: `Global`, `VN`, `US`. |
| **Reassign Role Selector (🙌)** | Dropdown | String (ID) | No | `None` | Used during role deletion when mapped admins > 0. |
| **Temporary Access Expiry (🙌)** | DateTime Picker | ISO Timestamp | No | `Null` | Automated role expiration timestamp. |

---

## 3.3. Error Messages & System Feedback

| Event / Trigger | Feedback Type | Message Content | Action / Recovery |
| --- | --- | --- | --- |
| Duplicate Role Name | Toast Error ✏️ | `"Role name '[Name]' already exists. Please choose a unique name."` | Highlights input in Red. Blocks submit. |
| Empty Role Name | Toast Error ✏️ | `"Role name is required"` ✏️ | Red error toast notice ✏️. |
| Unchecked Permission | Toast Error ✏️ | `"Please select at least one permission"` ✏️ | Red error toast notice ✏️. |
| System Role Modification | Toast Error | `"System-defined roles cannot be modified or deleted."` | Blocks action, logs security event. |
| Delete Role Confirmation | Warning Modal | `"Are you sure you want to delete the role '[Name]'? [X] admin(s) using this role..."` | Offers `[Cancel]` and `[Delete]` ✏️. |
| Data Scope Violation (🙌) | Banner Alert | `"Access Restricted: Data is outside your assigned Role Scope."` | HTTP 403 Forbidden screen. |
| Role Creation Success | Toast Notice ✏️ | `"Role '[Name]' created"` ✏️ | Green toast, auto-dismisses in 3s. |
| Role Update Success | Toast Notice ✏️ | `"Role '[Name]' updated"` ✏️ | Green toast, auto-dismisses in 3s. |
| Role Delete Success | Toast Notice ✏️ | `"Role '[Name]' deleted"` ✏️ | Amber warning toast notice ✏️. |

---

# 4. Non-Functional Requirements

- **Performance:** Permission updates propagate to JWT session tokens or cache stores under **< 100ms**.
- **Real-Time Revocation Latency (🙌 Proposed - Not yet on prototype):** SSE permission revocation payload reaches active client sessions within **< 500ms**.
- **Security:** Strict Server-Side RBAC & Data Scope evaluation. Sanitizes input parameters against OWASP Top 10 vulnerabilities.
- **Auditability:** 100% audit coverage for role mutations with JSON diff payload logging.
- **Usability:** Responsive modal layouts, high-contrast badges, keyboard navigation support (ESC to close modal, TAB focus trapping).

---

# 5. Prototype & Related Documents

- **Prototype UI:** https://prototype-admin-a272b.web.app/roles-permissions
- **Related Documents:**
  - [Proposals_and_Improvements_Roles_Permissions.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/Proposals_and_Improvements_Roles_Permissions.md)
  - [FRD - [License] Companies.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20Companies.md)
  - [FRD - [License] Module Registry.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20Module%20Registry.md)
  - [FRD - [License] License Packages.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20License%20Packages.md)
