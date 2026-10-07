# Document History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 15 tháng 4, 2026  | HANH NGUYEN | Create document  |
| 2.0 | 8 tháng 5, 2026  | HANH NGUYEN |  |
| 3.0 | 15 tháng 6, 2026  | HANH NGUYEN | Scenario 2.3, Scenario 3.3, Scenario 6.3
FR-02.1, FR-03.1, FR-05.1, FR-08.1 |
| 4.0 | 2 tháng 7, 2026  | HANH NGUYEN | FR-02.2, FR-05.4, FR-05.5 |

# 1. Overview

## 1.1. Purpose

This document specifies the functional requirements for the Companies module within the XCORP License Management System. The goal is to provide a centralized management tool to control the entire customer lifecycle (Tenant), from classification and package management (License), setting resource limits and quotations, to financial reconciliation (Ledger).

## 1.2. Scope

### 1.2.1. In-Scope Features

- **Tenant List Management:** View, filter, and search by status and classification.
- **Tenant Profile Management:** Edit contact information and classification (**Internal/Beta/External**).
- **Subscription Management:** Activate, renew, schedule plan changes, and manually update expiration dates.
- **Seat Assignment Management:** Assign licenses to Users/Teams and handle entitlement conflicts based on priority logic.
- **Ledger & Resource Tracking:** Display balances, record transactions, and monitor overage usage thresholds.

### 1.2.2. Out-Scope Features

- Configuration of **Module Registry** and **License Packages**.
- Automated payments via **Payment Gateways** (e.g., Stripe/PayPal).
- Information regarding subscription management (renew/change) on the **Billing** page in XCORP will be described in another document, view details in [FRD - [License] Subscription on the Billing page](https://app.notion.com/p/FRD-License-Subscription-on-the-Billing-page-350d736de4d380179ac6e9f1817bd904?pvs=21)

# 2. User Story

### US-01: **Tenant Profile and Status Management**

> *As a System Admin, I want to view and update administrative information as well as the operational status of the company so that customer data remains accurate and I can control their system access.*
> 

**Acceptance Criteria**

- **Scenario 1.1: Search and Filter Tenant List**
    - **Given**: The Admin is on the "Companies" list screen.
    - **When**: The Admin enters a company name in the search box or selects the "Overdue" status filter.
    - **Then**: The system displays a list of companies matching the keywords along with information: Domain, Type, Employees, License, and Balance.
- **Scenario 1.2: Edit Company Profile Information**
    - **Given**: The Admin is viewing a Company's details and clicks the "Edit" button.
    - **When**: The Admin changes fields such as "Company Name", "Company Type", or reselects the "Contact Person" and clicks "Save".
    - **Then**: The system saves the new information, logs the action in the Audit Trail.
    - **And:** The system automatically updates the Email/Phone based on the selected Contact Person.
- **Scenario 1.3: Tenant Deactivation**
    - **Given**: The Admin is on the detail page of an active company.
    - **When**: The Admin clicks the "Deactivate" button and confirms the warning notification.
    - **Then**: The company status changes to "Inactive" and all users belonging to that Tenant are immediately blocked from logging into the system.

### US-02: New License Assignment and Trial Setup

> *As a System Admin, I want to register the initial License package for a customer and set up the appropriate number of seats so that the customer can begin using the service.*
> 

**Acceptance Criteria**

- **Scenario 2.1: New License Assignment with Estimated Cost Calculation**
    - **Given**: The Admin opens the "Assign New License" Modal for a Tenant with no existing subscription.
    - **When**: The Admin selects a License package (e.g., Sales Team Package) and enters the quantities for "Admin Seat" and "Staff Seat".
    - **Then**: The system automatically calculates and displays the "Estimated Monthly Cost" using the formula: $\sum(\text{Seat Quantity} \times \text{Unit Price})$.
- **Scenario 2.2: Trial License Activation**
    - **Given**: The Admin is performing a new License assignment.
    - **When**: The Admin selects the "Use trial" checkbox and clicks "Assign License".
    - **Then**: The system activates the package with "Active (Trial)" status, does not apply charges to the Ledger, and applies the trial duration configured for the package.
- **UPDATE 15 tháng 6, 2026 Scenario 2.3: Configuration and Date Synchronization during Trial Activation**
    - **Given:** The Admin is on the "Assign New License" modal and checks the "Use trial" checkbox.
    - **When:** The Admin changes or selects a date in the "Trial End Date" field.
    - **Then:** The system automatically calculates and shifts the timeline for the paid phase based on the following formula:
        - $\text{Paid Start Date} = \text{Trial End Date} + 1 \text{ day}$
        - $\text{Paid End Date} = \text{Paid Start Date} + \text{Duration Preset/Custom}$ *(The system automatically populates this suggested date, and the admin can manually adjust it later).*

### US-03: Change Subscription and User Migration

> *As a System Admin, I want to switch the current subscription to a new package and map users to corresponding seat positions so that customer entitlements are ensured without manual re-assignment.*
> 

**Acceptance Criteria**

- **Scenario 3.1: Subscription Switch via Seat Mapping Mechanism**
    - **Given**: The Admin is performing a "Change Subscription" and selects "Mechanism 1 - Seat Mapping".
    - **When**: The Admin maps old seat types to new seat types and clicks "Confirm Change".
    - **Then**: The system automatically migrates all users from the old seats to the new seats and updates the "Effective Seat" for each user.
- **Scenario 3.2: Blocking Switch Due to Insufficient Seat Quota**
    - **Given**: The Admin is performing seat mapping for a new package.
    - **When**: The current number of users in an old seat type exceeds the number of seats purchased in the new package.
    - **Then**: The system displays a red "Mapping is blocked" warning and disables the confirmation button until the Admin purchases more seats or switches to custom assignment.
- **UPDATE 15 tháng 6, 2026 Scenario 3.3: Adjusting Seat Quantities within the Same Plan (Same-Plan Change Subscription)**
    - **Given:** The Admin performs a "Change Subscription" action for a Company with an currently Active license package.
    - **When:** The Admin selects a Target License that perfectly matches the currently active License, adjusts the purchased amounts in the Seat Quantities list, and clicks "Confirm Change".
    - **Then:** The system accepts the request, updates the new seat caps (`Seat Limit`) for the existing Subscription, and records this transition in the Subscription status history (`statusHistory`).

### US-04: Individual and Team/Group Seat Assignment

> *As an Admin, I want to assign Licenses to individuals or in bulk by Team/Group so that user entitlement management becomes flexible and efficient.*
> 

**Acceptance Criteria**

- **Scenario 4.1: Bulk Seat Assignment for Teams**
    - **Given**: The Admin is on the "Teams" tab within the User Assignments module.
    - **When**: The Admin clicks "Assign" for a specific Team (e.g., Backend) and selects the target seat type.
    - **Then**: The system assigns that seat type to all members in the Team and updates the "Source" column to "Inherit from Team" for related users.
- **Scenario 4.2: Assignment Conflict Resolution (Priority Logic)**
    - **Given**: A user has received a seat inherited from a Team.
    - **When**: The Admin performs a direct (Individual) assignment of a different seat type to that user.
    - **Then**: The system prioritizes the direct assignment as the "Effective Seat" and displays the Source as "Individual".

### US-05: Payment Recording and Ledger Reconciliation

> *As an System Admin, I want to record deposit transactions and track balance changes so that the Tenant's financial status is always transparent.*
> 

**Acceptance Criteria**

- **Scenario 5.1: Manual Payment Entry (Payment In)**
    - **Given**: The Accountant opens the "Record Transaction" Modal.
    - **When**: Enters the amount, description, and uploads payment proof (UNC), then clicks "Submit".
    - **Then**: The system creates a "Payment In" record (+), updates the "Running Balance," and displays the new balance status (red if still negative, white if positive).
- **Scenario 5.2: Early Cancellation Refund Calculation (Proration)**
    - **Given**: The Admin clicks "Refund Calc" for an Enterprise package being canceled early.
    - **When**: The Admin clicks "Process Refund Credit" after reviewing the prorated calculation results.
    - **Then**: The system automatically generates a "Refund Credit" transaction to add the balance back to the Tenant's Ledger.

### **US-06: Resource Usage Control (Limits & Quotas)**

> *As a System Admin, I want to establish debt limits and resource overage thresholds so that I can prevent financial risk when customers exceed usage.*
> 

**Acceptance Criteria**

- **Scenario 6.1: Setting Maximum Overage Allowed Thresholds**
    - **Given**: The Admin is on the "Limits & Quotas" tab.
    - **When**: The Admin modifies the value in the "Max Overage Allowed" field for a resource (e.g., AI Tokens) and clicks "Save".
    - **Then**: The system updates the new Total Cap and sends the information to the EMS Middleware for real-time entitlement control.
- **Scenario 6.2: Automated Service Suspension for Exceeding Billing Limits**
    - **Given**: A Tenant has an outstanding debt (Amount Owed) generated from Overage Charges.
    - **When**: The "Remaining" value (Billing Limit - Amount Owed) reaches $\le 0$.
    - **Then**: The system automatically triggers a suspended state, blocks the Tenant's access, and displays an overdue debt warning banner.
- **UPDATE 15 tháng 6, 2026 Scenario 6.3: Configuring Fixed Quotas for Metrics**
    - **Given:** The Admin is on the "Limits & Quotas" tab of a specific Company.
    - **When:** The Admin toggles the "Enable Fixed Quota" flag for a Resource Metric and enters a value into the "Fixed Quotas" field.
    - **Then:** The system updates the calculation mechanism for the hard service blocking limit (`Total Cap`) of that resource according to the following rules:
        - If `Fixed Quotas >< null` $\rightarrow \text{Total Cap} = \text{Free Quota} + \text{Fixed Quotas}$.
        - If `Fixed Quotas == null` *(or the flag is turned off)* $\rightarrow \text{Total Cap} = \text{Free Quota} + \text{Overage}$.

# 3. **Common Requirements**

- **Authentication:** Access is restricted to users with **Admin** or **Super Admin** roles belonging to **XPERC**.
- **Data Integrity:** The **Domain/Tenant ID** fields are **Read-only** once initialized.
- **Retention:** The system does not support data deletion (**Delete**); it only supports deactivation (**Deactivate**).
- **Audit Log:** All actions related to plan configuration changes, permission assignments, and payments must be permanently logged (Who did it? When? Old/New values?).

# 4. Functional Requirement Details

## 4.1. Company Profile Management

### FR-01.1:  Company Profile Management

- **Description:** The **Company Profile** feature allows System Administrators (Admin/Super Admin) to manage administrative information, customer classification, and contact details for each Tenant (Company)
- **Business Rules:**
    - **Permissions**: Only users with **Admin** or **Super Admin** roles are authorized to access and edit profile data.
    - **Display State**:
        - Defaults to **View mode** (Read-only).
        - Switches to **Edit mode** (Editable) when the user clicks the **"Edit"** button.
    - **UI Fields:**
        - **Company Info Section**
            
            
            | **Field Name** | **UI Type** | **Business Rules & Constraints** |
            | --- | --- | --- |
            | **Company Name** | Text Input | Allows the Admin to edit the display name of the company. |
            | **Country** | Dropdown | **Read-only**: Displays the country list. Information is for viewing purposes only and cannot be modified on this screen. |
            | **Domain** | Text | **Read-only**: The unique identifier for the Tenant; editing is strictly prohibited to maintain system integrity. |
            | **Company Type** | Dropdown | Values: **External, Beta, Internal**. Determines access to experimental features. |
            | **Total Employee** | Text | **Read-only**: Automatically calculated by the system based on the total number of employees belonging to the company. |
            | **Active User** | Text | **Read-only**: Automatically calculated based on the count of employees currently in "Active" status. |
        - **Contact Info Section**
            
            
            | **Field Name** | **UI Type** | **Business Rules & Constraints** |
            | --- | --- | --- |
            | **Contact Person** | Dropdown | **Dynamic Data**: Displays a list of all employees currently in **Active** status within the company for Admin selection. |
            | **Contact Email** | Text | **Read-only**: Automatically populated based on the Email address of the selected *Contact Person*. |
            | **Phone Number** | Text | **Read-only**: Automatically populated based on the Phone Number of the selected *Contact Person*. |
            | **Note** | Text Area | Allows for the entry of supplemental contact details (free-text). |
- **Use Case Specification**
    - **Updating Company Profile Information**
        
        
        | **User Action** | **System Behavior** |
        | --- | --- |
        | 1. Admin clicks the **"Edit"** button in the top-right corner of the Profile screen. |   • The system switches all fields to input states (Input field/Dropdown), except for the **read-only** field.
          • Hides the "Edit" button and displays two buttons, **"Save"** and **"Cancel"**, in the bottom-right corner. |
        | 2. Admin modifies information (e.g., changing Company Type from "Beta" to "External") and clicks **"Save"**. |   • Performs data validation.
          • Saves updated data to the database.
          • Logs the action in the **Audit Trail** (Who edited? What was edited? Timestamp?).
          • Displays a success notification and reverts the interface to **View mode**. |
    - **Canceling Edits**
        
        
        | **User Action** | **System Behavior** |
        | --- | --- |
        | Admin clicks the **"Cancel"** button while in Edit mode. | The system discards all unsaved changes and reverts to **View mode** with the original data. |
    - **Auto-fill Contact Information**
        - **User Action:** Admin clicks the **"Cancel"** button while in Edit mode.
        - **System Behavior:** The system discards all unsaved changes and reverts to **View mode** with the original data.
        
        | **User Action** | **System Behavior** |
        | --- | --- |
        | Admin clicks the **"Cancel"** button while in Edit mode. | The system discards all unsaved changes and reverts to **View mode** with the original data. |
    - **Real-time Employee Aggregation**
        - **System Behavior**:
            1. Whenever there is a change in headcount (Addition/Removal) or a status change (Active/Inactive) in the User Assignment.
            2. The system recalculates and updates the values for **Total Employee** and **Active User** upon refreshing the Company Profile page.

### **FR-01.2: Tenant Lifecycle & Status Control**

- **Description:** Manage the operational status of the Tenant.
- **Business Rules:**
    - **Status:** Active (In operation), Inactive (Deactivated).
    - **Balance Warning**: If the **Balance** is negative, the system displays the value in red to alert the Admin.
    - **Deactivate Logic:** When an Admin performs a "Deactivate" action, the system must immediately block all login access for users belonging to that Tenant.
        - When user click "Deactivate", the system must display a warning notification to user confirm: "Are you sure you want to deactivate [Company name]? This will mark the company as inactive. Active subscriptions will remain until expiry.”
    - **Reactivate Logic:** When an Admin performs a "Reactivate" action, the system must restore access for all users of that Tenant; the scope of access depends on the Tenant's **Active Subscription** at that time.
- **Pre-conditions:** The Tenant must already exist in the system.
- **Use Case Specification:**
    - **User Action:** Admin clicks the "Deactivate" button on the detail screen.
    - **System Behavior:** Display confirmation prompt → Update Tenant status to Inactive → Record system log.
- **Post-conditions:** The Tenant cannot access the system until they are "Reactivated."

## 4.2. Subscription Management

### **FR-02.1: Subscription Life-cycle Management**

- **Description:** Manage the purchasing, renewing, and canceling of Tenant subscription plans.
- **Business Rules:**
    - **Active License Constraint:** Each tenant can only have exactly **one (01) Base Plan** in the **Active** state at any given time.
    - **Manual Expiry Override:** Allows Admins to manually change the expiration date (e.g., for trial extensions).
    - **Refund Logic:** Refunds will be processed manually by the Admin.
    - **UPDATE 28 tháng 4, 2026 Subscription Status and Status History:** view details in [[License] A**ppendix**: Subscription Status Transition Matrix](https://app.notion.com/p/License-Appendix-Subscription-Status-Transition-Matrix-350d736de4d38083ad2ac2336e330033?pvs=21)

### **FR-02.2: Active Subscription Monitoring**

- **Description**: Displays detailed information regarding the currently executing service packages and seat resource usage.
- **Business Rules**:
    - **Term Tracking**:
        - Displays both the **Start Date** and **Expiry Date** of the package.
        - **Display color logic:**
            - **Red:** Expiration date has arrived
            - **Yellow:** Expiration date is approaching
            - **Green:** Still within the expiration date
    - **Seat Quota Control (Status Bar)**:
        - **Blue**: Displayed when usage remains within the allocated limit (e.g., 10/12).
        - **Red**: Displays an **Overage** warning when the actual number of assigned users exceeds the purchased limit (e.g., 5/4).
    - **UPDATE 15 tháng 6, 2026 Flag: Purchase Channel:** The system automatically logs this attribute to separate monetary processing workflows:
        - `ADMIN`: The package is created/renewed manually by an Admin via the Admin Portal based on an offline contract agreement. All calculations regarding invoice values, deductions, discounts, and ledger credits/debits are left open for the Admin to calculate and input manually.
        - `XCORP`: The package is purchased and self-managed by the business user (Tenant Owner) through automated configurations on the Billing Page of the front-facing XCORP system. The system automatically enforces calculations based on the Core Price and automatically reconciles the Ledger upon receiving a successful payment Webhook from `XCORP`.
    - **UPDATE 2 tháng 7, 2026 Interactive Purchase Channel Display:** Instead of only automatically logging this attribute for static classification, the system provides an interactive badge displaying the `ADMIN` or `XCORP` status right next to the License name. System Admins have the permission to click this badge to open the **"Edit Purchase Channel"** popup and modify it manually.
        - **Business Rules for the Purchase Channel Override Popup:**
            - Displays two standard radio button options: `XCORP` and `ADMIN`.
            - Upon clicking **[Save]**, the system updates the `purchaseChannel` attribute of the active subscription directly and logs the modification.
    - **UPDATE 15 tháng 6, 2026 Supplementary Popup: Override Subscription Dates:**
        - The Subscription management interface includes an additional action button that opens a popup to manually override the active date pair: `Trial End Date` and `Paid End Date`.
        - **Validation Rules (Hard Constraint):** The system validates against the real-time clock:
            - If the current time **has not exceeded** the `Trial End Date`: The system allows the Admin to freely modify both the `Trial End Date` and `Paid End Date` fields. When `Trial End Date` is altered, the automatic shifting logic updates the `Paid Start/End Date` as described in **Scenario 2.3**.
            - If the current time **has exceeded** the `Trial End Date` *(The tenant has completed their trial period and is currently within the billing period - Paid Phase)*: The system **locks down (Disables)** the `Trial End Date` input field to prevent historical tampering. The Admin is only granted permission to modify the `Paid End Date`.

### FR-02.3: Assign New License

- **Description:** Provides an interface that allows administrators to register new license packages for tenants who do not yet have a package or don’t have a active subscription at this time.
- **Business Rules:**
    - The "Assign a new license" button is only displayed if the company does not have an active subscription plan.
    - **Start Date:** User configures the date on which the subscription package takes effect.
    - **Duration:** The license validity period can be configured in one of two ways:
        - **Preset:** The user can choose a fixed period: 1 month, 6 months, 12 months.
        - **Custom:** The user chooses a specific end date.
    - **Select License Package:**
        - A list of available licenses that match the company type will be displayed for the user to choose.
        - Each package must clearly display feature descriptions and a release status label.
    - **Trial Logic**:
        - Allow the Admin to select a trial by checking the "Use trial" checkbox.
        - The trial period depends on the duration configured by the administrator in the License Package.
    - **Seat Quantities**:
        - Admins must input the desired quantity for each Seat Type included in the package.
        - Display the unit price for each seat type for easy reference.
    - **Cost Calculation**:
        - The system must automatically calculate the total monthly cost based on the entered seat quantities.
        - **Calculation Formula:**
            
            $\text{Estimated Monthly Cost} = \sum (\text{Seat Quantity}_i \times \text{Unit Price}_i)$
            
    - **Constraint**: A Tenant is restricted to a maximum of **01 Active Base Plan** at any given time.
    - **UPDATE 28 tháng 4, 2026** The mechanism for setting the License period is differentiated by the registration channel:
        - **Self-service Channel (Pricing/Billing Page):** Only allows the selection of fixed periods: **1 month, 6 months, 12 months**.
        - **Management Channel (License Management - Admin):** Allows the Admin to set a **Custom Period** based on specific agreements with customers, not restricted to fixed milestones.
- **Pre-conditions**:
    - The Tenant has been successfully created in the system and is currently in a "No active subscription" state.
    - The Admin possesses "Manage Licenses" permissions.
- **Use Case Specification**:
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Admin clicks the **"+ Assign New License"** button. | Displays the **"Assign New License"** Modal. |
    | 2. Admin selects the License package to be assigned. | Highlights the selected package and displays the corresponding seat types. |
    | 3. Admin enters the **Seat Quantities**. | Automatically updates the **"Estimated Monthly Cost"** based on the formula. |
    | 4. (Optional) Admin selects the **"Use trial"** checkbox. | The service package is marked as a trial; no charges will be applied during the trial period configured in the License Package. |
    | 5. Admin clicks the **"Assign License"** button. | Validates inputs → Creates the Subscription record → Closes the Modal and updates the Company Detail page. |
- **Post-conditions**:
    - A new Subscription record is generated with the appropriate status (Active Trial/Paid/Free).
    - If not a trial, the system generates a **"License Purchase"** transaction, deducting the amount from the Ledger

### FR-02.4: Renew Subscription

- **Description**: Provides an interface for the Admin to extend the usage duration of a Tenant's current License package without modifying existing seat configurations or feature settings.
- **Business Rules**:
    - **Current Package Information**: Displays the active package name (e.g., Enterprise Full Suite) and the current validity period (Start Date -> End Date) for Admin verification.
    - **Renewal Registration Date**:
        - By default, the registration date is set to the current package's expiry date (e.g., 2026-04-21).
        - Admins may manually re-select the registration date using a Date Picker.
    - **Renewal Duration**:
        - **Preset**: Offers fixed duration options (e.g., 3 months, 6 months, 1 year, 2 years) via a Dropdown menu.
        - **Custom**: Allows the Admin to input a specific number of months or choose a precise end date.
    - **Renew History**:
        - Displays a list of all previous renewals associated with this specific package for auditing and tracking.
        - If no prior renewals have been performed, the system displays "0 record(s)".
    - **Calculation Logic**: New Expiry Date = Current Expiry Date + Selected Renewal Duration.
- **Pre-conditions**:
    - The Tenant possesses an existing Subscription in either an "Active" or "Expired" state.
    - The Admin has initiated the process by clicking the "Renew" button on the **Overview & Licenses** screen.
- **Use Case Specification**:
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | 1. Admin selects the **"Renew Subscription"** tab (this is the default view upon opening). | Displays the current package details and the input fields for the renewal. |
    | 2. Admin selects the **Renewal Registration Date**. | Records the specific date for the renewal transaction. |
    | 3. Admin selects the **Renewal Duration** (e.g., 1 Year). | The system calculates the new estimated expiry date based on the existing package term. |
    | 4. Admin reviews the **Renew History**. | Expands the list showing historical renewal records. |
    | 5. Admin clicks **"Confirm Renewal"**. | Updates the Subscription with the new expiry date; records the transaction in the **Ledger**; and closes the Modal. |
- **Post-conditions**:
    - The updated expiry date is reflected on the **Overview & Licenses** dashboard.
    - A corresponding transaction record (License Purchase/Renewal) is generated in the **Billing & Ledger** tab.
    - The renewal action is permanently recorded in the system's **Audit Trail**.

## 4.3. Change Subscription

This feature enables Admins to Upgrade, Downgrade, or Switch to a different License package for a Tenant. The system provide controlled mechanisms for migrating existing users from their current seat types (old seats) to new seat types within the target package.

### **FR-03.1: Change Subscription Setup**

- **Description**: Configures the foundational parameters for the new subscription package.
- **Business Rules**:
    - **Target License**: The Admin selects one of the available license packages within the system.
    - **Apply Mode**:
        - **Apply Now**: The change takes effect immediately. The start date defaults to the current date.
        - **Schedule**: Allows the Admin to select an effective date in the future.
    - **Duration**: The Admin selects the package term via **Preset** or **Custom** options.
    - **Trial Option**: Allows the Admin to enable a **trial period** for the new package.
    - **Target Seat Quantities**: The Admin enters the number of seats for each type in the new package. The system displays the unit price per seat to calculate the estimated monthly cost.
    - **Activation:** The new package will be activated based on the established **Effective Date**.
    - **UPDATE 15 tháng 6, 2026** Relaxing the filtering constraints within the package selection dropdown: **The system now allows the Admin to select a target license (Target License) that matches the Company's currently active license.**
        - **Business Purpose:** Serves the operational requirement of reconfiguring or adjusting seat caps (`Seat Quantities`) or restructuring seat allocations (`Seat Types`) within the exact same tier of a license package when a customer signs an addendum, without forcing them to migrate to a completely different license tier. The user migration workflow (`User Migration`) and Quota Verification mechanisms remain active to validate the modified seat configuration.

### **FR-03.2: User Migration Mechanism**

The system provides two mechanisms to handle existing users during a package switch:

**Mechanism 1: Seat Mapping**

- **Description**: The Admin defines logical mapping rules to transition all users from old seat types to new seat types.
- **Business Rules**:
    - The system lists all current seat types that have assigned users.
    - The Admin selects the corresponding target seat type from the new package using a **Dropdown**.
    - **Validation (Critical Constraint)**: If the number of users in an old seat type exceeds the purchased quantity in the new package, the system must **Block** the action “**Confirm Change**” and display a red error warning.
    - **Error Message**: *"*Mapping is blocked. Seat [X] has [Y] user(s) but mapped target seat [Z] only has [W] seat(s). Please Buy more or switch to Custom Assignment".

**Mechanism 2: Custom Assignment**

- **Description**: Allows the Admin to perform granular seat assignments for individual users or groups.
- **Business Rules**: The system provides three management tabs:
    - **By User**: Lists every user, displaying their "Current Seat" and allowing the selection of an "Assign Target Seat". It displays the **Effective Result** and the **Source** of the assignment.
    - **By Team / By Group**: Enables seat assignment by department or user group.
    - **Seat Counter**: Positioned at the bottom of the Modal, displaying the count of used seats versus total purchased seats (e.g., 16 / 1). If the limit is exceeded, the counter turns red as a warning and the system must **Block** the action “Confirm Assign”.

**Use Case Specification**

| **User Action (Admin)** | **System Behavior** |
| --- | --- |
| 1. Clicks **"Change Subscription"** in Tenant details. | Displays the **Manage Subscription** Modal. |
| 2. Selects **Target License**, **Apply Mode**, and **Duration**. | Updates the initial configuration data. |
| 3. Enters seat quantities for the new package. | Calculates the **Estimated Monthly Cost**. |
| 4. Selects **Mechanism 1 - Seat Mapping**. | Displays the mapping list from old seats to new seats. |
| 5. Selects the target seat type for each old seat. | Performs a **Quota Check**. If valid, the system allows the Admin to proceed. |
| 6. Clicks **"Confirm Change"**. | Executes background user migration, updates the Subscription, and records the entry in the **Ledger**. |

## 4.4. User and Team/Group Assignments

The Seat Assignment feature allows Admins to allocate various seat types (e.g., Admin Seat, Staff Seat, etc.) to users. The system supports three assignment mechanisms to optimize administration:

- **Individual Assignment**: Assigned directly to each specific user.
- **Team Assignment**: Assigned according to the organizational structure (e.g., Product Team, QA Team).
- **Group Assignment**: Assigned according to logical or project-based groups (e.g., Engineering, Management).

### FR-04.1: **Individual User Assignment List**

- **Description**: Displays a comprehensive list of all users belonging to the Tenant and their current license usage status.
- **UI Components & Business Rules**:
    - **Table Columns**:
        - **USER**: Displays the user's Avatar and Full Name.
        - **EMAIL**: The unique identification email address.
        - **ROLE**: The user's role within the system (e.g., Manager, Staff, Director).
        - **TEAM / GROUP**: Displays tags representing the Teams and Groups the user is a member of.
        - **EFFECTIVE SEAT**: The final seat type actually received by the user after priority calculation. If no seat is assigned, it displays "**Unassigned**".
        - **SOURCE**: The origin of the license (e.g., Individual) along with the assignment date.
    - **Actions**:
        - **Assign**: Available for users currently without a seat.
        - **Reassign**: Used to change the current seat type.
        - **Remove**: Revokes the seat and resets the status to **Unassigned**.
- **Assignment Conflict Resolution Logic: Priority - The user's seat type will depend on the last assignment.**
- **UPDATE 2 tháng 7, 2026 Advanced User Filtering:** Provides a multi-criteria filter interface (Popover/Dropdown) on the Individual User grid to help Admins efficiently manage seat distribution for large-scale Tenants.
    - **Trigger Button:** Displays a **[Filter]** button showing the number of active filtering criteria in a `Filter (X)` format. Clicking the button toggles the filter configuration panel.
    - **Integrated Search:** Supports an inline search input box inside the dropdown menus for *Group*, *Team*, and *Effective Seat* filters to allow real-time keyword filtering of the criteria options.
    - **Mutually Inclusive Filtering Criteria:**
        - **Group Filter:** Allows selecting multiple groups (Multi-checkbox) from the available `companyGroups` list.
        - **Team Filter:** Allows selecting multiple teams (Multi-checkbox) from the available `companyTeams` list.
        - **Effective Seat Filter:** Allows selecting multiple resolved seat types or filtering specifically for users without a seat allocation (`Unassigned`).
        - **User Status Filter:** Filters user records instantly using static option buttons: `Active`, `Inactive`, or `All`.
    - **Control Actions:**
        - **Reset:** Clears all currently selected draft filters.
        - **Cancel:** Closes the popover panel and preserves the existing grid data state.
        - **Apply:** Executes the filter query on the user grid and updates the result count (`X users`). Active filters are displayed externally as dismissible **Tags** with an `x` button for quick removal.

### **FR-04.2: Team & Group Bulk Assignments**

- **Description**: Allows for the assignment of a specific seat type to all members within a Team or Group in a single operation.
- **Business Rules**:
    - **Active Member Visibility**: The system displays the count of active members per team/group to help the Admin gauge the scale of the assignment.
    - **Assign Seat Modal**: The Admin selects a Team/Group and chooses a target seat type (**Select Seat Type**) from the list of available Seat Types within the purchased License package.
    - **Member Detail View**: Before proceeding with a bulk assignment, the Admin can open a detail Modal to review the list of employees and the individual seat types they are currently utilizing.

### **UPDATE 28 tháng 4, 2026** FR-04.4: Pending Record Management

To ensure data consistency and prevent logical conflicts, the system applies the following pending record control rules:

- **Quantity Limit:** Each Company is permitted to maintain a maximum of **01 record in Pending status** at any given time.
- **Logic for Canceling an Active Package:**
    - If an Admin cancels an **Active Subscription** while a **Pending Record** exists, the system will **retain the original Effective Date** for that Pending Record.
    - The system **does not automatically fast-track (push up)** the activation date of the Pending package.
    - **Manual Intervention:** Admins retain the right to manually activate the Pending record if they require the package to take effect immediately following the cancellation of the old one.

## 4.5. Limits and Quotas

This feature allows Administrators (Admins) to set, monitor, and control the resource limits allocated to each Tenant (Company). The objective is to balance customer flexibility (allowing paid overage) with financial security for XCORP (preventing excessive bad debt).

- **Service Suspension:** If the **Remaining** balance is ≤ 0 or any individual resource reaches its **Total Cap**, the system must automatically trigger use blocking logic for the Tenant.

### FR-05.1: Resource Overage Limits

- **Description:** The system must support limit configuration for four primary resource types: **AI Tokens**, **Automation Runs**, **Storage**, and **Concurrent Sessions**.
- **Data Components for Each Resource:**
    - **Free Quota**: The amount of resources available within the subscription package (Base Plan).
    - **Current Usage**: The total amount of resources the Tenant has consumed within the current billing cycle.
        - If resource type is **Concurrent Sessions**, the system displays **Current Month Peak** data, instead of **Current Usage**
    - **Overage Limit**: The allowed threshold for additional usage beyond the package (typically subject to **Metered Fees**).
    - **UPDATE 15 tháng 6, 2026 Fixed Quota**
        - Toggle **Enable Fixed Quota:** Defaults to False (Off). When toggled to True, the system reveals the `Fixed Quotas` input field.
        - An input field to allocate a standalone, fixed resource capacity specifically for this Company.
        - Only visible when the above flag is active.
            - When this value is populated (Not Null): The system shifts the hard limit blocking formula to: $\text{Total Cap} = \text{Free Quota} + \text{Fixed Quotas}$.
            - When left blank (Null): The system maintains the default formula: $\text{Total Cap} = \text{Free Quota} + \text{Overage}$.
    - **Total Cap**: This is the hard limit at which the system stops providing the specific service.
    - **Max Overage Allowed**: An input field allowing Admins to customize the maximum overage value for a specific Tenant.
- **UI Status Logic:**
    - **Normal (Blue)**: Resource usage is within the Free Quota.
    - **High (Yellow)**: Resource usage is within the Overage Limit and is incurring additional charges.
    - **Block (red):** The allowed overage limit has been reached. The company cannot use any more.

### FR-05.2: Over-Quota Billing Limits

- **Description:** The system must monitor and control the total financial value of overage usage to determine the operational status of the Tenant.
- **Business Rules:**
    - **Billing Limit**: The maximum debt amount a Tenant is permitted to accumulate before services are suspended.
    - **Amount Owed**: The total **Overage Charge** amount generated from resource usage beyond the free quota that remains unpaid.
    - **Remaining**: A calculated value $= \text{Billing Limit} - \text{Amount Owed}$
    - **Max Billing Overage**: An input field for the Admin to establish the maximum debt ceiling.

### UPDATE 8 tháng 5, 2026 FR-05.3: Limits & Quotas tab for Free Package

- **Description:** For companies using the free license package, instead of displaying settings related to Overage (exceeding the paid limit), the system will display progress bars so users know their current resource usage compared to the allowed limit of the free package.
- **Business Rules:**
    - **Logic:** When tenant is using Free package, the system will hide the "Resource Overage Limits" and "Over-Quota Billing Limits" items (for Paid packages) and replace them with the "Free Quotas Usage" block.
    - **Usage Metrics:** The system tracks three primary metrics based on the **Free quotas for per company** configuration defined in the License:
        - **Data Storage:** Total storage used (Unit: GB).
        - **Active Users:** Number of currently active users in the system.
        - **Limit Create Projects:** Maximum number of projects allowed to be created.
    - Each metric consists of two values:
        - **Current Usage:** The actual real-time usage of the company.
        - **Free Quota:** The maximum limit granted under the Free plan.
    - **Color Coding for Progress Bars**
        - **Blue:** When `Current Usage` ≤ 80% of `Free Quota` (Safe state).
        - **Yellow:** When `Current Usage` > 80% of `Free Quota` (Warning state - nearing limit).
        - **Red:** When `Current Usage` ≥ `Free Quota` (Limit reached state).
    - **Progress Calculation**
        - The progress bar displays a percentage based on the formula: `(Current Usage / Free Quota) * 100`. The maximum displayed value is capped at 100%.
    - **Blocking logic:** when `Current Usage == Free Quota` , the system automatically triggers a suspended state, blocks the Tenant's overusage, and displays a warning banner.

### UPDATE 2 tháng 7, 2026 FR-05.4: Seat Overage Limits

- **Description:** Allows administrators to configure the maximum allowed number of overage positions (Overage Limit) for each specific seat type under active subscriptions.
- **Monitored Data Components:**
    - **Purchased Seats:** The total quantity of seats officially granted under the active subscription's Base Plan.
    - **Max Overage Allowed:** An input field for Admin configuration. Constrained to non-negative integers ($\ge 0$).
    - **Current Usage:** The actual real-time count of users currently occupying this seat type (including direct individual assignments and team/group inheritances).
    - **Total Cap:** The hard blocking limit calculated using the formula:
        
        $\text{Total Cap} = \text{Purchased Seats} + \text{Max Overage Allowed}$
        
    - **UPDATE 10 tháng 7, 2026 View detail button:** when user click to button, the system will navigate to `User Assignment > sub-tab User` and apply `filter Effective Seat` corresponding to specific seat type.
- **UI Status Logic & Service Suspension:**
The progress bar visualizes the consumption percentage using the formula `(Current Usage / Total Cap) * 100` and transitions colors based on the following conditions:
    - **Safe State (Blue):** Triggered when `Current Usage $\le$ Purchased Seats`. The progress bar renders in blue, indicating usage is within the pre-paid limit.
    - **In Overage State (Yellow/Orange):** Triggered when `Purchased Seats < Current Usage < Total Cap`. The progress bar turns yellow/orange, displays an *"In Overage"* badge, and logs the excess seats for metered billing calculations at cycle finalization.
    - **Service Suspended State (Red):** Triggered when `Current Usage $\ge$ Total Cap` OR when `Max Overage Allowed = 0` but `Current Usage > Purchased Seats`. The progress bar turns red, displays a *"Service Suspended / Blocked"* warning, and hard-blocks any further user seat assignments while sending an enforcement signal to the Middleware.
- **Use Case Specification:**
When the Admin clicks **[Edit]** in the Seat Usage section, the *Max Overage Allowed* fields become editable. Once **[Save]** is clicked, the system validates the input, updates the `Total Cap`, reverts to view mode, and creates an Audit Trail entry: *"Seat overage limits updated"*.

### UPDATE 2 tháng 7, 2026 FR-05.5: Audit Log Storage Quota

- **Description:** Configures the operational retention period for automatically keeping or purging system audit logs for the specific Tenant.
- **Business Rules & UI Controls:**
Provides three mutually exclusive retention settings managed via interactive Radio Cards:
    1. **Storage by Plan:** Automatically syncs the retention period with the default rules of the purchased License Package (e.g., 30 days). The UI displays this value in a Read-only state.
    2. **Fixed Quota:** Enables an input number field allowing the Admin to specify a custom retention period (Unit: `Days`, Constraint: $\ge 1$). This value completely overrides the default package duration.
    3. **Unlimited Storage:** Ensures all audit log records are preserved indefinitely, bypassing any automated cleanup cycles.
- **Save Logic:** Giao diện defaults to View mode. When the Admin clicks **[Edit]** and selects a new configuration, the system maps the entries to the database fields `auditLogStorageQuota` and `isAuditLogUnlimited`, and creates an audit log entry: *"Audit Log Storage quota updated"*.

## 4.6. Billing and Ledger

The **Billing & Ledger** provides tools for Accountants and Administrators to monitor balances, track transaction history, record manual payments, and calculate refunds based on proration policies.

- **Data Integrity**: Once a transaction record is submitted, it cannot be deleted or edited. Any corrections must be performed via a new counter-transaction entry.
- **In-Scope:**
    - **Ledger Dashboard**: Displays real-time balances and overdue alerts.
    - **Transaction History**: A detailed table listing all financial movements.
    - **Manual Record Transaction**: An input form for manual payments or balance adjustments.
    - **Refund Calculation**: A tool to calculate credit returns for early subscription cancellations.
- **Out-Scope:**
    - Automated debt clearance via integrated payment gateways

### **FR-06.1: Ledger Dashboard & Transaction History**

- **Description**: Provides a comprehensive overview of the Tenant's financial status.
- **Business Rules**:
    - **Current Balance**:
        - Displayed in red with a warning banner if the balance is negative (Overdue status—Tenant has used resources beyond their deposited amount).
        - Notification Message: "Overdue — Company has used beyond deposited amount".
    - **Transaction History Table**: Displays columns: Date, Type, Description, Amount, and Running Balance.
    - **Transaction Types**:
        - **Payment In**: Deposited funds.
        - **License Purchase**: Deductions for subscription package activations.
        - **Overage Charge**: Monthly fees for excess resource usage (AI Tokens, Automation Runs).
        - **Refund Credit**: Funds returned to the Ledger.

### **UPDATE 8 tháng 5, 2026 FR-06.2: Create Record Transaction**

- **Description**: A form allowing Admins or Accountants to manually record credit/debit transactions and refunds into the company’s Ledger, including the option to upload supporting documents.
- **Business Rules**:
    - **Trigger:**
        - The user clicks the **[Record Payment]** button in the Billing & Ledger tab.
        - The system automatically redirects the user from the **[Refund Calc]** feature.
    - **Data Fields**:
        - **Transaction Type**: Dropdown menu to select the specific transaction nature. The system supports the following default transaction types: ***Payment In, License Purchase, Overage Charge, Refund Credit***
        - **Amount**: The monetary value of the transaction.
            - If the Type is Payment In or Refund Credit, the amount is recorded as a Credit (+).
            - If the Type is License Purchase or Overage Charge, the amount is recorded as a Debit (-).
        - **Description / Notes**: A mandatory field for detailed explanation.
        - **Attachments**: Supports file uploads (e.g., receipts, invoices) for audit purposes.
            - Supported formats: PDF, PNG, JPG, XLSX.
            - Maximum size: 10MB per file.
    - **Auto-Calculate Balance**: The `Balance` field is not editable. The system automatically calculates the real-time balance at the time of entry using the formula: `New Balance = Current Balance + Transaction Amount`

### **UPDATE 8 tháng 5, 2026 FR-06.3: Refund Calculation**

- **Description**: Automatically computes the remaining value of a subscription for refund processing.
- **Business Rules**:
    - **Proration Formula**: The system calculates the monthly unit price (`Contract Value` / `Contract Duration`) and multiplies it by the `Months Remaining`.
    - **Displayed Data**: Shows Contract Value, Contract Duration, Months Used, and Months Remaining for transparency.
    - **Process Refund Credit:**
        - **Trigger:** The user clicks the **[Process Refund Credit]** button within the *Refund Calculation* popup.
        - **UI/UX & Flow:**
            - The system closes the *Refund Calculation* popup.
            - The system automatically opens the *Record Transaction* popup and pre-fills the following fields:
                - **Transaction Type:** Set to `Refund Credit` by default.
                - **Amount:** Pre-filled with the calculated refund amount from the proration logic.
                - **Description:** Automatically generates a standard note (e.g., *"Refund: X months prorated credit"*).
            - The admin can upload additional attachments and click **[Submit Transaction]** to finalize the entry.

### **UPDATE 8 tháng 5, 2026 FR-06.4: View Transaction Detail**

- **Description:** Allows users to view the full details of a specific transaction in the history log, including the ability to download attached documents.
- **Business Rules:**
    - **Trigger:** The user clicks the **[View / Eye]** icon in the *Action* column of the *Transaction History* table.
    - **Data Fields & UI Elements:**
        - **Transaction ID:** String format, Read-only.
        - **Date:** Transaction date (YYYY-MM-DD), Read-only.
        - **Type:** Transaction type displayed with color-coded badges:
            - **Green:** Payment In, Credit Refund
            - **Red**: Overage Charge
            - **Gray:** License Purchase
        - **Amount:** Displays a **`+`** in green if positive, and a **`-`** in red if negative, followed by the currency.
        - **Description:** A text block showing the full transaction notes.
        - **Attachments:**
            - If files exist: Displays a list of attachments with file names and clicking the name to view.
            - If no files exist: Displays a placeholder text: *"**No attachments for this transaction."***
    - **Alternate Flow:** Users can click outside the popup or the **[Close]** button to return to the Billing & Ledger tab.

## 4.7. Usage Stats

The **Usage Stats** provides a granular view of resource consumption for each Tenant per billing cycle. The system automatically reconciles the subscription **Quota** against actual **Usage** to calculate any incurred fees.

- **Business Rules & Technical Logic:**
    - **Aggregation Cycle**: Usage data must be aggregated periodically on a monthly basis (**Monthly Billing Cycle**).
    - **True-up Process**: At the end of each cycle, the system automatically finalizes the figures and pushes an "**Overage Charge**" transaction to the Ledger to adjust the Tenant's balance.
    - **Seat Overage Logic**: Overage fees for Seats (Admin/Staff) are calculated based on the actual number of assigned seats exceeding the plan's quota at the time of the report finalization.

### FR-07.1: **Usage Summary Dashboard**

The system must display cumulative metrics for a quick assessment of the Tenant's status:

- **Billing Months Tracked**: Total number of months the system has recorded usage data for the Tenant.
- **Months with Overage**: The count of months where at least one resource exceeded its quota.
- **Total Overage Charges**: The total historical financial value (VND) of all accumulated overage fees to date.

### FR-07.2: Monthly Usage Report

The system allows users to select and view data for specific months via a navigation **Tab bar**.

- **Tab Display Logic**: Months with recorded overages must display a warning icon (**Yellow Triangle**) for easy identification by the Admin.
- **Metric Table Details**:
    - **Metric**: Tracked resources (Admin Seat, Staff Seat, Storage, AI Tokens, Automation Runs).
    - **Quota**: The free allowance included in the current subscription package.
    - **Used**: Actual resource consumption recorded as of the report date.
    - **Overage**: The calculated difference ($\text{Used} - \text{Quota}$). Positive values are displayed in red if the quota is exceeded.
    - **Rate**: The unit price defined for each unit of overage usage (**Metered Fee**).
    - **Charge**: $\text{Total cost}= \text{Overage} \times \text{Rate}$.
    - **Status**: Labels based on consumption levels:
        - **Over (Red)**: Usage has exceeded 100% of the quota.
        - **High (Yellow)**: High consumption (e.g., >80% of the quota).

### FR-07.3: Usage Visualization

Below the data table, the system displays **Progress Bars** for a visual comparison between **Used** and **Quota**:

- **Red bars** represent metrics that have exceeded their thresholds (**In Overage**).
- **Yellow/Orange bars** represent metrics approaching their limits (**High Usage**).

### FR-07.4: Overage History

The system displays a list of all past overage records for Ledger reconciliation purposes:

- **Columns**: Month, Metric, Over By (Excess amount), Charge (Total cost).
- This data must achieve 100% synchronization with "Overage Charge" transactions in the **Billing & Ledger** module.

## UPDATE 12 tháng 6, 2026 4.8. Overview of Company Management

### FR-08.1: Tenant List Search and Filter

- **Description:** Allows the Admin to perform quick searches by keywords or utilize Quick Status Filters to look up and monitor the company (Tenant) list.
- **Business Rules:**
    - **Search Mechanism:**
        - The system performs a partial match search based on the text string entered by the Admin in the search box.
        - The target data fields applicable for searching include: `Company Name` and `Domain`.
        - The system automatically triggers the search after the Admin stops typing or when pressing Enter.
    - **Quick Filter Mechanism:** The system provides 3 mutually exclusive, single-choice filters at any given time:
        - `All`: Displays the entire company list without applying any special status filters.
        - `Expiring Soon`: Only displays companies whose primary License package is near expiration (based on the system-defined number of remaining days).
        - `Overdue`: Only displays companies currently holding a negative financial balance (`Balance < 0`).
    - **Currency Display Rule:** The data in the `Balance` column must accurately reflect the configured currency format (using the `$` symbol prefixing the amount, and rendering negative balances in red text).
- **Pre-conditions:** The Admin has successfully logged into the XCorp Admin system and possesses the required permissions to access the "Companies" menu.
- **Use Case Specification:**
    
    
    | **User Action** | **System Behavior** |
    | --- | --- |
    | **1.** Admin navigates to the "Companies" screen. | **2.** The system loads and displays the default company list under the `All` tab. Concurrently, it updates real-time metrics on the 4 top KPI Summary cards: `TOTAL COMPANIES`, `ACTIVE`, `EXPIRING SOON`, and `OVERDUE BALANCE`. |
    | **3. Search:** Admin enters a keyword into the search box labeled "Search by company name or domain...". | **4.** The system executes the query, filters the list, and displays companies matching the keyword "Trinh" in either their Company Name or Domain. |
    | **5. Filter** Admin clicks the `Overdue` filter button. | **6.** The system clears the search keyword (if any), filters the list, and displays only the companies with outstanding balances (`Balance` shows a negative value). |
    | **7. No Data:** Admin enters a non-existent keyword or clicks a filter that returns no matching results. | **8.** The system displays an empty list along with a "No companies match your search or filters" message. The Summary cards remain unchanged. |
- **Post-conditions:** The Admin can click the row of any company to redirect to the detailed profile screen of that specific Tenant.

# 5. Non-Functional Requirements

- **Performance:**
    - **Middleware Latency**: Entitlement check logic (Entitlement Guard) must achieve a response time of **< 20ms** to avoid impacting the end-user experience.
    - **Bulk Processing**: Bulk license assignment operations for **100+ users** must be completed within **< 5 seconds**.
- **Security:**
    - **Access Permissions**: Access to the Company module is only available to accounts with the access rights defined in the Role and Permission module.
    - **Audit Trail**: All modifications to package configurations, pricing, entitlement assignments, and Tenant statuses must be permanently logged and are non-deletable and non-editable.
- **Reliability:**
    - **Data Integrity**: When deleting or deactivating a License, the system must perform a **Reference Check** to ensure that active Subscriptions are not affected.
    - **Immutability**: The system does not support physical deletion (**Hard Delete**) of financial transaction data or Tenant information to facilitate auditing and reconciliation.
- **User Experience:**
    - **Status Feedback**: Usage metrics (**Usage Stats**) must be visualized via **Progress Bars** with color-coded warning zones (**Blue/Yellow/Red**).

# Prototype

https://prototype-admin-a272b.web.app/

# Related Documents

 Document - Modules and License Management