# Document History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 1 tháng 4, 2026  | HANH NGUYEN | Create document |
| 2.0 | 16 tháng 4, 2026  | HANH NGUYEN | Update Scope
Update Common Requirement |

# 1. Overview

## 1.1. Purpose

This document defines the business flows and system requirements for the new company registration (Sign-up) process. It allows customers to select an initial package (Free or Paid - If paid package, allow or not allow trial) from list of dynamic licenses configured within the system.

## 1.2. Scope

### 1.2.1. In-Scope Features

- ~~Allow **New Companies** to register for any **Public License** provided by the company.~~
- **UPDATE 16 tháng 4, 2026** Allows new companies registering for Public License packages to have their configurations displayed publicly on the Pricing page.
- **UPDATE 16 tháng 4, 2026** Dynamic Module Display: The display of detailed information about the modules within each license package on the Pricing page must adhere to the sorting order and the hide/show status configured in theUPDATE 16 tháng 4, 2026 FR-07: Module Display & Visibility Management on Pricing page
- Logic to activate a Trial status for paid packages with Admin-defined duration ([X] days).
- Logic to activate a permanent Active status for Free packages.
- System recording of Trial Start Date and End Date.

### 1.2.2. Out-Scope Features

- Upgrading or Downgrading packages after the initial registration
- **UPDATE 17 tháng 4, 2026 Post-Trial Expiration Logic**
    
    The system shall execute the following procedures on the trial expiration date (Day X+1):
    
    - **Subscription Status**
        - **Status Transition:** The License Status automatically transitions from Active to Inactive License.
        - **Characteristics:** The Trial package is officially marked as ended. The system retains historical records to prevent a company from registering for multiple trials.
    - **Access Control & Billing Module**
        - **Business Feature Lockdown:** The system restricts access to all business-related modules and features.
        - **Exception for Billing Module:**
            - Users maintain full access to the Billing module.
            - **Purpose:** To enable users to view expired package details, review transaction history, perform renewals, or purchase a new Paid Package to restore system services.
    - **Data Persistence**
        - **Principle:** Company data must strictly not be deleted.
        - **Data State:** All customer data generated during the trial period is transitioned to a "Read-only" state or temporarily locked. This data shall become accessible again immediately after the customer successfully pays for a new package.
    - **User Interface & Conversion Flow**
        - **Blocking Screen:** When a user attempts to access any business module, the system displays an expiration notification: “Your [X]-day trial has ended. Please contact Administrator or go to Billing to process Payment.”
        - **Reminder Notification:** A persistent banner is displayed in the global navigation (Top bar) regarding the trial expiration status.
- **UPDATE 16 tháng 4, 2026 Trial-to-Paid Conversion:** The conversion flow from trial to paid subscription will be described in detail at [FRD - [License] Companies](https://app.notion.com/p/FRD-License-Companies-335d736de4d38064b015c33cd84b0a71?pvs=21)
- **UPDATE 16 tháng 4, 2026 Private License Flow:** The process of sending a direct registration link along with a token to a specific customer to use the Private License will be described in a another document.
- Automatic billing/charging after Trial expiration.
- Detailed module definitions within each package (defined in separate technical documentation)

# 2. User Story

### US-01: Sign up a New Company

> As a New Company Owner, I want to select a license type during registration so that I can immediately access the system with appropriate features.
> 

**Acceptance Criteria**

**Scenario 1.1: Register for a [X]-day Trial**

- **Given**: The user has registered a new company and is on the License Selection page.
- **When**: The user clicks the **"Try FREE for [X] days"** button for a paid package.
- **Then**: The system creates an **Active Subscription** with `allow_Trial = True`.
- **~~And**: The License Tag is set to **Trial,**~~
- **And:** The License Status is set to **Active**.
- **And**: The **Expiry Date** is calculated as: `Current_Date + [X] days`.

**Scenario 1.2: Register for Free License**

- **Given**: The user has registered a new company and is on the License Selection page.
- **When**: The user clicks the **"Register Free"** button for the Free package.
- **Then**: The system creates an **Active Subscription** for the FREE package with an **Active** status.
- **And**: The **Expiry Date** is `null` (**Permanent**).

**Scenario 1.3: Register for a Package with No Trial**

- **Given:** Admin configures Package B with `allow_Trial = False`.
- **When:** User views the License list on the (License Selection) Pricing page.
- **Then:** The system does not display the "Try FREE" button for Package B, only displaying the “Registry” button.

# 3. Functional Requirements

## 3.1. Common Requirements

- The License Selection (Pricing) page for New Companies must accurately display the list of Public Licenses configured by the Admin.
- Each New Company is entitled to only **one (01) Trial across all packages** in the system. Once a Trial is used for any package, the Trial option for all other packages must be disabled.
- **UPDATE 16 tháng 4, 2026** The system clearly distinguishes between the two independent data fields as follows:
    
    
    | **Field** | Valid Value | Interpretation |
    | --- | --- | --- |
    | **License Type** | `Paid`, `Free` | Categorizing the subscription options for license packages. |
    | **License Status** | `Active`, `Inactive` | The actual operating status of the license package. |
    | **allow_Trial** | `True/False` | Allows you to try the License package for n days. |
- **UPDATE 16 tháng 4, 2026 Display Consistency:** The Pricing/License Selection page must not display modules with the `show_on_pricing = false`. View the details: UPDATE 16 tháng 4, 2026 FR-07: Module Display & Visibility Management on Pricing page
- **UPDATE 16 tháng 4, 2026 Ordering Logic:** The order of module rows in the feature table on the Pricing page must perfectly match the `display_order` set by the Admin in the Module Registry. View the details: UPDATE 16 tháng 4, 2026 FR-07: Module Display & Visibility Management on Pricing page

## 3.2. Functional Requirements Details

### FR-01: License & Trial Mapping Logic

- **Description:** The system automatically adjusts the interface and expiration date calculation logic according to the Admin’s configuration in License Packages.
- **Business Rules**:
    - Display logic in Pricing page:
        - If `allow_Trial = True` and `Trial_Duration > 0` : show "**Try FREE for [X] days**" button.
        - If `allow_Trial = False` : show **"Register"** button.
        - **Default Trial:** When a company first registers, the system always displays the "**Try FREE for [X] days**" option for Paid packages (if the Admin configures `allow_Trial = True`).
    - **Free Package**: show “Register Free” button, no usage time limit, `Price = 0`, `Expire_Date = null`.
    - **Trial Package**: If a paid package is selected via the Trial flow, the system applies a `Trial_Duration = [X] days`.
    - **Automated Provisioning**: The system automatically assigns the feature set (Modules/Features) to the Tenant based on the License Package Configuration of the selected license.
    - The system must fetch `allow_Trial` and `Trial_Duration` in real-time from the License Packages page to display the Pricing page.
- **Pre-conditions**: The user has registered a new company with full identity information.
- **Use Case Specification**
    
    
    | User Action | System Behavior |
    | --- | --- |
    | Select "**Try FREE for [X] days**" for any package other than **FREE**. | 1. System checks if the Company has previously used a Trial.
    2. If valid, set `Start_Date = Today`, `End_Date = Today + X`, and `Status = Trial`.  |
    | Complete registration. | The system shall redirect the user to the XCORP system and automatically provision access to the Modules/Features as defined in the selected License Package configuration. |
    | Select "**Try FREE for [X] days**" but the Company has already used a trial. | The system displays an error message: "**You have reached your trial limit**" and prompts the user to select the Free package or a Paid package to continue. |

# 4. Non-Functional Requirements

- **Auditability**: Every license selection during sign-up must be recorded in the **Audit Log** (Who, When, Package).