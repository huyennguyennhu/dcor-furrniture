# 1. Overview

## 1.1. Purpose

This document specifies the business and functional requirements for the **Usage & Billing** screen (Subscription, Usage, and Payment Management) of the XCORP system. This feature enables administrative users to monitor subscription package statuses, analyze consumed resources, and process payments for any additional/over-limit charges (Overage).

## 1.2. Scope

### 1.2.1. In-Scope Features

- **Subscription Info**: View current package details, expiration dates, billing cycles, and specific allotment details for each seat type (Admin Seat, Staff Seat).
- **Usage Analytics**: View visual charts for Seat Usage and Resource Quotas, alongside a detailed Monthly Usage Report that includes over-limit cost calculations (Overage).
- **Payment & Billing**: View outstanding balances, billing history, and corporate billing information.
- **Permission Control by Purchase Channel (ADMIN vs. XCORP)**:
    - **ADMIN Channel**: Redirects actions through a sales contact portal ("Contact Sales") and hides the payment method section.
    - **XCORP Channel**: Allows self-service plan modifications ("Change Plan") and

### 1.2.2. Out-Scope Features

- Actual payment processing flows executed via third-party payment gateways (Payment Gateway API Integration).

# 2. User Story

## **US-01: View and Manage Subscription, Usage, and Billing Details**

> *As an* Account Administrator,
*I want to* view my current subscription status, monitor monthly resource usage, and manage payments,
*So that* I can ensure uninterrupted service and optimize our operational costs.
> 

### Acceptance Criteria

- **AC-01**: The system must provide 3 primary tabs: *Subscription Info*, *Usage Analytics*, and *Payment & Billing*.
- **AC-02**: If `Purchase Channel = **ADMIN**`, the system displays the **Contact Sales** button in the *Subscription Info* tab and HIDES the "Payment Method" block in the *Payment & Billing* tab.
- **AC-03**: If `Purchase Channel = **XCORP**`, the system displays the **Change Plan** button in the *Subscription Info* tab and DISPLAYS the "Payment Method" block (including card info, Update Payment Method, and Enable Auto-pay) in the *Payment & Billing* tab.
- **AC-04**: The system must provide color-coded alerts (Red/Yellow) when resource consumption exceeds or approaches its limit (Overage/High).

### Scenario 1.1: View Billing and Pay Outstanding Balance (XCORP Channel)

- **Given**: A user is logged into the system via the **XCORP** purchase channel and has an outstanding unpaid invoice (Outstanding Balance).
- **When**: The user navigates to the **"Payment & Billing"** tab.
- **Then**: The system displays a red notification banner stating *"Outstanding Balance: $300.00"* along with a **Pay Now** button, while fully rendering the *"Billing Information"*, *"Billing History"* (with the latest invoice status as *Pending*), and the *"Payment Method"* block in the bottom right corner.

# 3. Functional Requirements

## 3.1. Common Requirements

- **Currency Formatting**: All costs are displayed by default in USD ($).
- **Status Alerts (Visual Indicators)**:
    - **Over** (Red): When actual usage exceeds the package limit (`Current Usage ≥ Free Quotas/Purchased Quotas`).
    - **High** (Yellow): When usage reaches a warning threshold (`Current Usage ≥ 80%`).
    - **Normal** (Green): Resource usage is within safe operating limits (`Current Usage < 80%`).

## **3.2. Functional Requirements Details**

### **FR-01: Subscription Info & Detail Specification**

- **Description**: Displays an overview of the current subscription package and allows users to view the explicit entitlements of each Seat type.
- **Business Rules**:
    - The actionable plan modification button is dependent on the `Purchase Channel` (ADMIN $\rightarrow$ Contact Sales; XCORP $\rightarrow$ Change Plan).
    - The system displays package details (*Package Name, Price, Start Date, End Date, Billing Cycle*).
        - If the channel is **ADMIN**: Display the **Contact Sales** button. When user click **Contact Sales** button, the system will display a modal:
            - Title: Contact Sales and a short description.
            - Input fields: **Name** (Text field), **Email** (Text field), **Message** (Textarea field).
            - When user click **Submit Request** button, the system will send the information via email to the system administrator, display a success toast and close modal.
        - If the channel is **XCORP**: Display the **Change Plan** button. When user click Change Plan button, please view the detail at 3.3. Change Subscription
    - When user clicks the **"View details"** link next to the package name, the system opens the **"Subscription Details"** side panel on the right, presenting the list of Modules & Sub-modules and Limits & Metrics for seat types.
    - The **Scheduled Changes** section is only displayed when customer have a change plan. The system will display package and schedule detail: *Package Name, Effective Date, Billing Cycle.*
- **Pre-conditions**: The user has successfully accessed the Usage & Billing screen.

### FR-02: Usage Analytics & Monthly Report

- **Description**: Monitors resource volume and counts utilized during the current month and calculates over-limit penalty fees.
- **Business Rules**:
    - **Seat Usage** Section: Horizontal bar charts for Admin Seats and Staff Seats.
    - **Resource Quotas** Section: Visual charts for Data Storage, Automation Runs, AI Tokens, and Concurrent Sessions, Audit Log Storage.
    - **Monthly Usage Report** Section: Period filter (defaults to current month), displaying a detailed metrics table (Metric, Quota, Used, Overage, Rate, Charge, Status) and the Total Overage.
        - If a month have Overage > 0, a yellow warning icon will be displayed on this month tag.
        - `Total Overage` = Sum of all `Charge (USD)` line items with an **Over** status.
        - Formula:   $\text{Charge} = \text{Overage} \times \text{Rate}$
            
            (e.g., Admin Seat exceeding +5 seats $\times$ $15.00/seat = $75.00).
            

#### FR-03: Payment & Billing Management

- **Description**: Manages outstanding balances, invoice history, and automated payment information based on the designated Purchase Channel.
- **Business Rules**:
    - Displays a red **Outstanding Balance** banner with a **Pay Now** button if arrears exist.
    - **Billing History** list (historical invoices as *Paid*, new invoices as *Pending*).
    - **Billing Information** section: User can edit the Billing Information
    - Payment Method section:
        - **If Channel = ADMIN**: Does not render the Payment Method section
        - **If Channel = XCORP**: Renders the **Payment Method** block in the bottom right corner, containing: Masked Visa card details, an **Update Payment Method** button, and Automatic Payments configurations.

### UPDATE 28 tháng 7, 2026

#### FR-04: Package Change/Renewal Processing

- **Plan Modification Logic (CHANGED - XCORP Channel):**
    - **Apply Now:** If payment fails $\rightarrow$ The system cancels the Change Request and allows the user to continue using their existing license.
    - **Schedule:** On the Effective Date, if payment fails $\rightarrow$ The system cancels the Change Schedule and continues using the existing license.
    - **System Notifications:** Update the notification message logged for Change Requests.
- **Renewal Logic (RENEWAL - XCORP Channel):**
    - When due for renewal, if payment fails $\rightarrow$ The system will execute a service **Block**, but will still generate a **Pending Bill** for the Renewal.

#### FR-05: Service Block Logic

- **Block Logic upon payment failure or non-payment:**
    - **XCORP Channel:**
        - *Overage metric:* Performs a **block** based on the exceeded overage metric figures.
        - *Overage seat:* Performs a **block** on users exceeding the allotted seat count.
        - *General block mechanism:* Based on the metric's **Total Cap** and **Over-limit Billing** configurations.
    - **ADMIN Channel:** Performs a **block** based on the metric's **Total Cap** and **Over-limit Billing** configurations.

#### FR-06: Payment, Ledger & Purchase Channel Switch Management

- **Description:** Manages outstanding balances, invoice history, single-click bulk payment, Ledger entries creation, and handling logic during Purchase Channel switches.
- **Business Rules:**
    - **Purchase Channel Switching (XCORP** $\rightarrow$ **ADMIN):**
        - **XCORP** $\rightarrow$ **ADMIN:** All bills currently in Pending status $\rightarrow$ **Current Balance** will be recorded as **negative (-)**.
        - **ADMIN** $\rightarrow$ **XCORP:** When Current Balance is **negative (-)** $\rightarrow$ The system automatically generates a bill in **Pending** status.
    - **Payment Method (XCORP Channel):**
        - The UI currently provides a single **Pay Now** button (the system processes payment for all pending bills combined in one transaction).
    - **Ledger Creation Rules (XCORP Channel):**
        - **Overage Bill (Bill overage):** Creates **1 negative (-) record**.
        - **Pay Overage Bill (Pay bill overage):** Creates **1 positive (+) record**.
        - **Renewal Bill (Bill renewal):** **No** ledger record is created.
        - **Pay Renewal Bill (Pay bill renewal):** Simultaneously creates **2 records (1 negative and 1 positive record).**
    - **Payment Method Section Configurations:**
        - *Channel = ADMIN:* Completely hides the Payment Method section.
        - *Channel = XCORP:* Renders the Payment Method block in the bottom right corner containing: Masked Visa card details (e.g., `*** **** **** 4242`), Update Payment Method button, and Automatic Payments configurations.

# 4. Non-Functional Requirements

- **Security**: Credit card information rendered on the UI within the Payment & Billing tab (XCORP Channel) must be masked, displaying only the final 4 digits (e.g., `*** **** **** 4242`).
- **Usability**: The system must supply distinct high-contrast color alerts (Red for Over/Outstanding Balance, Yellow for High) to ensure users instantly recognize risk vectors threatening service continuity.

# Prototype

https://prototype-billing-page.vercel.app/

# Related Documents

 Document - Modules and License Management