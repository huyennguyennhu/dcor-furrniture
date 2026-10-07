# Document History

| Version | **Date** | **Author** | **Changes** |
| --- | --- | --- | --- |
| 1.0 | 9 tháng 3, 2026  | HANH NGUYEN | Create Document |
| 2.0 | 16 tháng 4, 2026  | HANH NGUYEN | Update License Status Changes
Free/Paid Configuration
FR-05 |
| 3.0 | 10 tháng 7, 2026  | HANH NGUYEN | FR-02 |

# 1. Overview

## 1.1. Purpose

This document specifies the functional requirements for the License Packages module within the XCORP License Management System. The objective is to transition from a "one-size-fits-all" model to a Modular Licensing model. The system enables Administrators to flexibly package features (Modules) into Seat Types and establish diverse pricing policies for various customer segments.

## 1.2. Scope

### 1.2.1. In - Scope

- **License Builder:** A tool for initializing and managing general license package information.
- **Seat Type Definition:** Defining seat types (job roles/positions) within a package.
- **Module & Feature Gating:** Assigning Modules to seats and controlling the activation/deactivation of sub-features.
- **Pricing Strategy:** Establishing Hybrid pricing configurations (Platform fee + Metered fee).
- **Metadata & Domain Tagging:** Applying tags to distribute packages across different Storefronts.

### 1.2.2. Out - Scope

- The process of assigning Licenses to Tenants (part of the Companies module).
- Automated payment gateway integration (Stripe/PayPal).
- Real-time entitlement verification logic (EMS Middleware logic).

# 2. User Stories

## US-01: License Management

> *As a System Administrator, I want to centrally manage the list of License packages so that I can quickly search for, adjust operational statuses, or set a default package for customers.*
> 

**Acceptance Criteria**

- **Scenario 1.1: Setting a Default License Package**
    - **Given:** The User is on the License Packages list screen.
    - **When:** The User clicks the “Star” icon on the “License Package” card.
    - **Then:** The system displays a “DEFAULT” label on this package and removes the default label from the previous one.
    - **And:** This package becomes the preferred choice when initializing a new Tenant.
- **Scenario 1.2: Searching and Filtering the License List**
    - **Given:** The system contains multiple License packages in various statuses.
    - **When:** The User enters a package name into the Search bar or selects the “All/Active/Inactive” filter tabs.
    - **Then:** The system displays records matching the filter criteria in real-time.
- **Scenario 1.3: View License Details**
    - **Given:** The User finds the target license in the list.
    - **When:** The User clicks on the license.
    - **Then:** The system displays the information of license.

## US-02: Create and Configure License

> *As a System Administrator, I want to self-define the structure of License packages by combining Modules, setting prices, and managing marketing content so that I can optimize product value without source code intervention.*
> 

**Acceptance Criteria**

- **Scenario 2.1: Configuring Seat Types with Module and Feature Gating**
    - **Given:** The User is in the "Builder" tab of the Create/Edit License screen.
    - **When:** The User adds a new Seat Type (e.g., "Sales Seat"), assigns the "Task Management" module, and selects specific sub-features.
    - **Then:** The system automatically accumulates the Module price into the total Seat price (Price/Mo).
    - **And:** The system locks (sets to Read-only) any features marked as "CORE.”
- **Scenario 2.2: Managing Multi-language Marketing Content**
    - **Given:** The User has completed the technical configuration and switched to the "Marketing & Content" tab.
    - **When:** The User selects the "Tiếng Việt" language and enters the marketing description for the package.
    - **Then:** The system stores the content separately for each language code and displays it correctly on the corresponding Storefront.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Description:** All configurations must be dynamic and stored in the database.
- **Constraints:** Any change to a package must trigger an entry in the Audit Trail.

## 3.2. Functional Requirement Details

### FR-01: License List Management

- **Description:** Provides a centralized Dashboard interface for administrators to monitor the entire list of License packages, perform search operations, use tab-based filtering, and manage the operational status of each individual package.
- **Business Rules:**
    - **Status Tabs (Filtering):** The system categorizes the list into three main tabs, including the count of records displayed in parentheses: **All**, **Active**, and **Inactive**.
    - **Default License:**
        - Only one (01) License package is permitted to carry the yellow **"DEFAULT"** label at any given time.
        - When a user clicks the **"Star" icon** on a different package, the system transfers the **DEFAULT** label to that package and removes it from the previous one.
        - **Constraint:** Only License packages classified with the **PUBLIC** badge can be set as the Default License.
    - **License Status Changes (Deactivate/Reactivate):**
        - **Deactivate:** The user clicks the **"Circle-slash" icon** to suspend the package.
            - **UPDATE 16 tháng 4, 2026** Do not attempt to deactivate a license currently set to DEFAULT.
                - If the administrator attempts to deactivate, the system must block the action.
                - Display the error message: *"You must set a different license as Default before deactivating this one."*
        - **Confirmation Dialog:** Upon deactivation, the system must display a confirmation dialog with the following content: *"Are you sure you want to deactivate [License Name]? This license will no longer be available for new assignments. Existing subscriptions remain active until expiry"*.
        - **Reactivate:** Within the **Inactive tab**, the user clicks the **"Checkmark" icon** to reactivate the package.
    - **Classification Badges:** Each package must clearly display a **PUBLIC** label (green - Storefront) or a **PRIVATE** label (orange - dedicated to specific customers).
    - **Card Details:** Each card must display a summary including: Package Name, Description, Domain Tags (xcorp.app, syrix.ai), Prepay Discount labels (% 6mo, % 1yr), and current Seat Type information (Seat name, price/month, and number of modules).
    - **Usage Statistics:** Display a link formatted as **"X company using this license"** which leads to the list of customers currently using that specific package.
    - **Search:** Supports searching by **License Package Name** (based on the administrative business flow).
- **Pre-conditions:** The user has successfully logged into the management system with **Super Admin** privileges or appropriate License Management permissions.
- **Use Case Specification:**
    1. **Access:** The User accesses the **License Packages** menu from the Sidebar.
    2. **Default View:** The system defaults to displaying the **Active tab** with the list of currently available packages.
    3. **Transferring Default:** User clicks the **"Star" icon** on a Card → The system updates the new DEFAULT label.
    4. **Suspension Action:** User clicks the **"Circle-slash" icon** → The system displays the confirmation dialog → User  clicks **"Deactivate"**.
    5. **Status Transition:** The system moves that package to the **Inactive tab**; the Card is greyed out and displays a red **"DEACTIVATED"** badge.
    6. **Editing:** User clicks the **"Pencil" icon** (edit) to navigate to the **Edit License** screen.
- **Post-conditions:** The License package status and the Dashboard interface are accurately updated based on the user's actions.

### FR-02: Create New License

- **Description:** Allows users to initialize a new License package through a two-step process: technical configuration (Builder Tab) and marketing content setup (Marketing & Content Tab).
- **Business Rules:**
    - **Package Info**: Package Name and Type are mandatory fields.
        - **Private License Logic**: If **"Private (Custom Deal)"** is selected as the Type, the system must display an **"Assigned Companies"** section for the User to search and assign specific companies to this package.
    - **Domain Tagging**: At least one domain (xcorp.app or syrix.ai) must be selected to identify the package's distribution.
    - **Prepay Discount**: Supports inputting percentage discounts for 6-month and 1-year terms. The system displays a preview message (e.g., *"Customers save 5% for 6-month prepay..."*) immediately below for verification.
    - **Usage Metrics Configuration**: User selects measurement metrics (AI Tokens, Automation Runs, Data Storage, etc.) and enters an **"Overage Rate"** (the additional price per unit used beyond the defined limit).
    - **Deployment Options**: Allows selecting between **"Apply Now"** (immediate effect) or **"Schedule"** (scheduling effective dates by day).
    - **UDPATE 16 tháng 4, 2026 Free/Paid Configuration:** The package will fall into one of the two types below:
        - **Free:**
            - The system only allows usage within the specified limit.
            - Logic: When the user exceeds the limit → The system blocks usage, no overcharging.
        - **Paid:**
            - The user can exceed the limit.
            - Logic: The system records the excess usage to apply overcharging charges.
            - When selecting the Paid type, the `allow_Trial` flag will be displayed, allowing the Admin to set whether or not to allow trial and the trial period.
            - When Admin check to `allow_Trial` checkbox, the `Trial_Duration` box will be displayed, allowing Admin set duration allow trial
                - If `allow_Trial = True` and `Trial_Duration > 0` : user can try the License Package in `Trial_Duration` days
                - If `allow_Trial = False` : user cannot try the License Package
    - **UPDATE 10 tháng 7, 2026 Audit Log Storage:**
        - When Admin check to Audit Log Storage, the options will be displayed, allowing the Admin to set the limit of storage (days)
            - Limit Storage: enter a number of days
            - Unlimited
- **Pre-conditions:** User clicks the **"New License"** button from the Dashboard.
- **Use Case Specification:**
    1. User enters basic information in the **Package Info** section and selects the applicable **Domains**.
    2. If it is a Private package, user performs a search and selects companies from the **Assigned Companies** list.
    3. User sets the discount rates in the **Prepay Discount** section.
    4. User configures the measurement metrics and overage fees in the **Usage Metrics** section.
    5. User proceeds to Seat configuration (FR-03) and Marketing setup (FR-04).
    6. User clicks **"Save Package"** to complete the process.
- **Post-conditions:** The new License package is stored and ready to be activated or displayed according to the schedule.

### FR-03: Seat Type Configuration

- **Description**: Configuring "Seat Types" within a License package by assigning Modules, setting feature permissions, and establishing usage limits.
- **Business Rules**:
    - **Built-in Modules**: The system automatically assigns default modules ~~(Organization, Settings)~~ to every License and prohibits their removal.
    - **Seat Default**: Each License package allows setting one (01) Seat Type as the default via the **"Default Seat"** toggle.
        - This seat is automatically assigned to a customer's new employees upon their addition to the company.
    - **Module Permissions**: User defines the access level for each Module: **Full Access** or **View Only**.
    - **Feature Gating (Core vs. Add-on)**:
        - Features labeled **"CORE"** are always selected by default and cannot be deselected.
        - User can optionally toggle other **Add-on** features to create differentiation between various packages.
    - **Pricing Accumulation**: The system automatically calculates the **"PRICE/MO"** for each Seat based on the combined prices of the selected Modules.
    - **Free Quota**: User establish free usage limits for each Seat (e.g., 1000 AI Tokens/month) in the **"Free Quota per User/Month"** section located at the bottom of the seat configuration.
- **Pre-conditions**: The User is on the Create or Edit License screen and selects **"Add Seat Type"**.
- **Use Case Specification**:
    1. User enters the **Seat Name** and selects the **Default Seat** status if necessary.
    2. User selects Modules from the **Modules Configuration** list.
    3. For each Module, the User selects the permission level (Full Access/View Only) and configures the **Add-on** features.
    4. User enters the quantity of free resources in the **Free Quota** section.
    5. The system displays a summary in the **Package Summary** section (e.g., "1 Seat Type, 2 module configs total").
- **Post-conditions**: The Seat Type configuration is successfully attached to the License package.

### FR-04: Marketing and Content Management

- **Description**: Manages the presentation content of the License package on the Storefront, supporting multiple languages and a flexible Content Key system.
- **Business Rules**:
    - **Language Support**: User can switch between **English** and **Tiếng Việt** to enter corresponding translated content.
    - **Content Key Registry (Key Manager)**:
        - Allows User to self-create new information fields (Keys) by entering a `key_name`, `Display Label`, and `Description`.
        - Once added, these Keys will be displayed in the management list and appear as input fields within the **"Marketing & Content"** tab.
    - **Preview Translation**: While editing in one language, the system displays the "ghost text" of the alternative language beneath the input fields to assist User with translation cross-referencing.
- **Pre-conditions**: The user switches to the **"Marketing & Content"** tab within the Create/Edit License interface.
- **Use Case Specification**:
    1. The user selects the language for data entry (e.g., **English**).
    2. The user enters content into the standard marketing information fields.
    3. If a new information field is required, the user clicks **"Manage Content Keys"** → enters the Key information → clicks **"Add Key"**.
    4. The user switches to the second language (**Tiếng Việt**) to complete the translation content.
    5. The user saves the License package to apply the content changes.
- **Post-conditions**: Marketing content is stored and ready to be displayed on the Storefront according to the end-user's language preference.

### FR-05: License Configuration Update and Deactivate/Reactivate

- **Description**: Manages updates to existing license package settings, seat definitions, and controlling their operational status (Active/Inactive).
- **Business Rules**:
- **Editability & Constraints**:
    - User can modify Package Info, Prepay Discounts, Usage Metrics, and Seat Type details (Modules, Permissions, and Features).
    - For **Private (Custom Deal)** licenses, the User can update the list of **Assigned Companies**.
    - Identifiers such as **Domain Tags** remain editable but must be validated to prevent breaking existing Storefront distributions.
- **Seat Maintenance**: Allows changing the **Default Seat**, adding/removing modules, and toggling feature permissions within an existing seat.
- **Deployment Options**:
    - **Apply Now**: Changes take effect immediately across all relevant tenants.
    - **Schedule**: Changes are staged with a future **Effective Date**. A system Cronjob executes the update at the start of that date.
        - **UPDATE 16 tháng 4, 2026** When selecting Schedule mode, the system must adhere to the following specifications:
            - **Timezone:** Based on Tenant's time zone to ensure accuracy according to the customer's location.
            - **Effective Time:** Defaults to 00:00 on the selected day.
            - If the Cronjob fails, the system will automatically send an email notification to all Admin
            - Notification: Sends notifications (System Notification/Email) to the Admin immediately after the Cronjob successfully or unsuccessfully executes.
- **Deactivate Constraints (Reference Check)**:
    - Before deactivation, the system checks the **Companies Using This License** section.
    - Deactivation blocks new assignments but allows existing subscriptions to remain active until their expiry date.
    - **UPDATE 16 tháng 4, 2026** Do not attempt to deactivate a license currently set to DEFAULT.
        - If the administrator attempts to deactivate, the system must block the action.
        - Display the error message: *"You must set a different license as Default before deactivating this one."*
- **Reactivate Logic**: Suspended licenses in the **Inactive** tab can be restored to the **Active** state to allow new company assignments.
- **Pre-conditions**: The User clicks the **"Pencil" icon** on the Dashboard card or the **"Edit License"** button within the License details view.
- **Use Case Specification**:
    
    
    | User Action | System Behavior |
    | --- | --- |
    | **Update Configuration** |  |
    | 1. Modify settings in the **Edit License** interface (e.g., change module price or feature gating). | 1. Validates inputs and updates the Package Summary (e.g., "1 Seat Type, 2 module configs total"). |
    | 2. Select a deployment strategy: "**Apply Now**" or "**Schedule**". | 2. Prepares the update record or stages it for the Cronjob. |
    | 3. Click "**Save Package**". | 3. Updates the database and returns to the License list/overview. |
    | **Status Change** |  |
    | 1. Click the "**Circle-slash" icon** (Deactivate) on the Dashboard. | 1. Displays a confirmation dialog stating the impact on existing/new assignments. |
    | 2. Click "**Deactivate**" in the dialog. | 2. Moves the license to the Inactive tab and marks the card as **DEACTIVATED**. |
    | 3. (Optional) Click the **"Checkmark" icon** in the **Inactive** tab. | 3. Reactivates the license and moves it back to the **Active** tab. |
- **Post-conditions**: The License configuration is updated, or the operational status is successfully transitioned.

## 3.3. Prototype

https://prototype-admin-a272b.web.app/

https://prototype-admin-a272b.web.app/

# 4. Non-Functional Requirements

- **System Latency**: Response time from the Entitlement Guard middleware must be under **20ms** to ensure no disruption to the end-user experience.
- **Background Task Processing**: Scheduled changes must be accurately processed by a nightly **Cronjob** to avoid impacting daytime system performance.
- **Access Control**: Access to this module is strictly restricted to users with **Super Admin** roles or specific License Management permissions.
- **Auditability**: Every action related to package configuration modifications or license status updates must be permanently logged.
- **Data Integrity (Reference Check)**: When deactivating or deleting a License, the system must perform a reference check to ensure that active Subscriptions are not disrupted or corrupted.
- **User Experience (UX)**: The system must provide a **Confirmation Dialog** with clear warnings before executing critical actions, such as deactivating a License package.

# Related Documents

 Document - Modules and License Management