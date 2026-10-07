# 1. Overview

## 1.1. Purpose

This document defines the functional requirements for the Subscription management flow and payment directly on the customer's **Billing** page. The objective is to synchronize the package processing logic (lifecycle), user migration mechanisms (migration), and resource limit displays (limits) with XPERC License Management system.

## 1.2. Scope

### 1.2.1. In-Scope Features

- Display current plan information, subscription status, and billing history.
- Subscription change flow (**Upgrade/Downgrade/Switch**).
- Seat assignment mechanism when changing plans (**Seat Mapping & Custom Assignment**).
- Management of pending activation records (**Pending Record**).
- Real-time resource usage monitoring (**Resource Usage**).

### 1.2.2. Out-Scope Features

- Configuration of the Module Registry and License Packages.
- Automated payment processing via third-party gateways (e.g., Stripe/PayPal).
- Configuration of pricing and special discounts for each Tenant (performed within the **License Manager** admin portal).
- To sign up a new company and registry a subscription package for the first time, view details in [FRD - [License] Sign up new company](https://app.notion.com/p/FRD-License-Sign-up-new-company-335d736de4d380f6972fe8a9543fe6c4?pvs=21)

# 2. User Story

### US-01: Change Subscription & User Migration

> *As a Tenant, I want to proactively change subscription plans and configure employee access to maintain business operations without waiting for manual support from the system Admin.*
> 

**Acceptance Criteria**

- **Scenario 1.1: Performing a plan upgrade with the Seat Mapping mechanism**
    - **Given:** The administrator is on the Billing page and selects "**Change**" for the subscription plan
    - **When:** Selecting a higher new plan (e.g., Professional), choosing a cycle (1/6/12 months), and selecting the "**Apply Now**" mode.
    - **Then:** The system displays the "**Seat Mapping**" Modal to map old Seat types to new Seat types.
    - **And:** Upon confirmation, the system automatically migrates all users to the new Seat types and updates the subscription status to "**Active**".
- **Scenario 1.2: Blocking plan changes until 100% migration is complete**
    - **Given**: The administrator is at the "Seat & Migration Setup" step to switch to a new plan.
    - **When**: At least one employee has not yet been assigned a new seat type via either Mapping or Custom Assignment.
    - **Then**: The system displays a red warning "**Mapping is blocked**" with the message: *"You have assigned [x] out of [N] users. Please ensure all existing users are assigned to a new target seat before confirming.”*
    - **And:** The "**Confirm Changes**" button is disabled until the assignment status reaches 100%.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Description**: General rules applicable to the entire Subscription flow on the Billing page.
- **Constraints:**
    - **Subscription Status**: Must comply with 4 statuses: **PENDING, ACTIVE, EXPIRED, CANCELED**.
    - **Period (Cycle)**: Customers can only select fixed milestones: **1 month, 6 months, 12 months**.
    - **Pending Record Limit**: Each Tenant is restricted to a maximum of **01 record in Pending status** at any given time.
        - **Logic for Canceling an Active Package**: If an Admin or User cancels an Active Subscription while a Pending Record exists, the system must retain the original Effective Date for that Pending Record.
        - **Manual Intervention**: Allow Admins the right to manually activate a Pending record earlier than the scheduled date if required.
    - **Integrity**: Tenant Domain and ID fields are **Read-only** and cannot be modified.
    - **Wizard Navigation**: The system must provide a 3-step progress bar: **Choose package**, **Seat & migration**, and **Review** when Tenant set up Change Subscription.

## 3.2. Subscription Management

### FR-01: Subscription Dashboard & Active Monitoring

- **Description:** Display current plan information and cost forecasting.
- **Business Rules:**
    - Display detailed info: Plan name, Unit price/user/month, Storage capacity.
    - Display "**Next Charge Estimate**" for the upcoming billing cycle.
    - Color logic for expiration: **Red** (Expired), **Yellow** (Approaching expiry), **Green** (Active/Safe).
    - **Bill History**: Display a list of invoices or past transactions.
    - **Billing Information**: Allow users to view and update the "Invoice Contact" information.
    - **Payment Method**: Display information for the linked card or payment method.
- **Pre-conditions:** User has logged in with Admin/Billing permissions.
- **Use Case Specification:** User is fully informed of their financial status and current plan.

### **FR-02: Resource Usage & Limits Visualization**

- **Description**: Visualize resource consumption (Tokens, Runs, Storage) via progress bars.
- **Business Rules**:
    - **Green (Normal)**: Usage is within the Free Quota.
    - **Yellow (High)**: Usage exceeds the quota and is incurring **Overage** charges.
    - **Red (Block)**: Reached the **Total Cap**. System blocks the corresponding feature.

## 3.3. Change Subscription

### **FR-03: Step 1 - Choose Package**

- **Description**: Displays a comparison table of available License packages.
- **Business Rules**:
    - **Pricing Cycle**: Users select the billing cycle (1/6/12 months) via a dropdown menu in the top-right corner.
    - **Plan Comparison**: Displays package cards  including prices, storage limits, and feature lists.
    - **Selection**: A "**Selected**" status is displayed on either the current package or the newly selected package.
- **Pre-conditions**: The user is on the Billing page and clicks the "**Change**" button.

### **FR-04: Step 2 - Seat & Migration Setup**

- **Description**: Configure activation parameters and assign Seats to users.
- **Business Rules**:
    - **Activation Settings**:
        - **Apply Mode**: Select between "**Apply Now**" or "**Schedule**".
        - **Start Date**: Displays the activation date based on the Apply Mode (defaults to the current date if "Apply Now" is selected).
        - **Duration**: Select the package term (e.g., 1 month).
    - **Migration Mechanisms**:
        - **Mechanism 1 - Seat Mapping**: Administrators map old seat types to new seat types for large groups.
        - **Mechanism 2 - Custom Assignment**: Opens a popup for manual Seat assignment by individual **User**, **Team**, or **Group**.
    - **Custom Assignment Priority**: Applies the rule: "**Latest assignment wins across User, Team, and Group operations**" (the most recent assignment action takes precedence).
    - **Validation Logic**:
        - The system checks the employee list in real-time.
        - The "**Mapping is blocked**" status persists until every employee holding a seat in the old package has been assigned a corresponding seat type in the new package.
    - **Cost Calculation:** The estimated cost formula is now based on actual assignment results:
        - $\text{Estimated Monthly Cost} = \sum (\text{Actual Assigned Seats} \times \text{Unit Price})$
    - **Billing period:**
        - Selecting **Apply Now** starts the new billing cycle immediately from the current date.
        - Selecting **Schedule** means the new pricing applies only starting from the Effective Date.
    - **Intermediate State**: When a user selects **Schedule**, the current plan must remain **Active** until the new package transitions from **Pending** to **Active**.

### **FR-05: Step 3 - Review & Apply**

- **Description**: Displays a summary of all changes for final review before application.
- **Business Rules**:
    - **Change Overview**: Displays a comparison between the current and next subscription, the effective date (including Apply Mode), the billing cycle, and the selected migration mechanism.
    - **Seat List**: Provides a detailed breakdown of seat types, quantities, and their corresponding costs.
    - **Estimate Total Price**: Displays the total expected cost for the new subscription.
    - **Action**: Clicking the "**Apply changes**" button officially records the Subscription entry (as **Active** or **Pending**) into the system.
    - **Confirmation**: The system officially finalizes the seat quantities and updates the Ledger only after the user clicks "**Apply changes**".
    - **Trial Logic**: If upgrading from Free to Paid and the customer has never used a trial, the system automatically adds trial days based on the package configuration.
    - **Notification**:
        - Display a notification stating the XCORP team will contact them to process the cost difference.
        - Send a notification for XCORP team to handle the related issues.

# 4. Non-Functional Requirements

- **Logic Consistency**: Ensure the system uses the current "Active Seats" list of the Tenant as the baseline for the 100% completion check in Step 2 of Change Subscription flow.
- **Data Integrity**: Every Subscription change (Upgrade/Downgrade) must be recorded in a detailed Audit Log, including: Who performed it, timestamp, old values, and new values.
- **Security**: Only accounts with **Admin** or **Billing Owner** permissions are authorized to execute the Change Subscription flow.

# 5. Prototype

https://prototype-admin-a272b.web.app/

https://prototype-billing-page.vercel.app/

# Related Documents

Document - Modules and License Management