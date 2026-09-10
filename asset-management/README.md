# 🏢 Asset Management — Microsoft Power Apps Code App

An enterprise-grade **Asset Management System** built as a **Microsoft Power Apps Code App** using **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**, powered directly by **Microsoft Dataverse** as the backend.

---

## 📑 Table of Contents
1. [Tech Stack & Architecture](#-1-tech-stack--architecture)
2. [How to Create a Power Apps Code App from Scratch](#-2-how-to-create-a-power-apps-code-app-from-scratch)
3. [Creating Dataverse Tables & Importing into React](#-3-creating-dataverse-tables--importing-into-react)
4. [Role-Based Access Control (RBAC) & Security](#-4-role-based-access-control-rbac--security)
5. [How to Prompt AI Agents Efficiently for Code Apps](#-5-how-to-prompt-ai-agents-efficiently-for-code-apps)
6. [Step-by-Step Debugging Guide](#-6-step-by-step-debugging-guide)
7. [Commands Reference: Run, Build, Push](#-7-commands-reference-run-build-push)

---

## 🛠️ 1. Tech Stack & Architecture

### Frontend Layer
- **Framework:** React 19 + TypeScript (`strict` mode)
- **Bundler & Tooling:** Vite 7 with `@microsoft/power-apps-vite`
- **Styling:** Tailwind CSS v4 (native `@tailwindcss/vite` plugin)
- **Icons:** Lucide React (`lucide-react`)

### Power Platform & Dataverse Layer
- **Platform SDKs:**
  - `@microsoft/power-apps/app` — Retrieves signed-in user context (`getContext()`).
  - `@microsoft/power-apps/data` — Provides typed OData client (`getClient()`) for Dataverse CRUD & bound/unbound functions.
  - `@microsoft/power-apps-cli` — Local dev server proxy, schema generator, and deployment engine.
- **Backend Database:** Microsoft Dataverse (Custom Tables + System Tables)
- **Authentication & Authorization:** Microsoft Entra ID + Dataverse Security Roles

```
┌─────────────────────────────────────────────────────────────┐
│                 Microsoft Power Apps Host                   │
│   (Provides Entra ID Authentication & Dataverse Session)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│  ┌───────────────────────┐       ┌────────────────────────┐ │
│  │ User & Role Context   │       │ Generated Services     │ │
│  │ (getContext + RBAC)   │       │ (Assets, Requests, etc)│ │
│  └───────────┬───────────┘       └───────────┬────────────┘ │
│              │                               │              │
│              ▼                               ▼              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ UI Layer: Dashboard, Assets, Requests, Approvals, Admin│ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Microsoft Dataverse                     │
│  - Tables: cr240_asset, cr240_assetrequest, systemusers...  │
│  - Security: Environment Security Roles & Table Privileges  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 2. How to Create a Power Apps Code App from Scratch

### Prerequisites
1. **Node.js:** v18 or v20+ installed.
2. **Power Platform CLI (PAC):** Install via VS Code extension or install global npm package:
   ```bash
   npm install -g @microsoft/power-apps-cli
   ```
3. **Power Platform Environment:** An active Dataverse environment where you have System Customizer or System Administrator rights.

### Step 1: Authenticate PAC with your Environment
```bash
pac auth create --environment "https://<your-org-name>.crm.dynamics.com"
```

### Step 2: Initialize a New Code App Project
In your desired workspace folder, create the Code App:
```bash
pa app create --name "asset-management" --template "react"
```

### Step 3: Inspect `power.config.json`
`power.config.json` links your React frontend to the Power Apps Code App resource in Dataverse:
```json
{
  "version": "1.0",
  "appId": "b3ba7434-e384-4fa0-b21c-bf8a09c52fbf",
  "appDisplayName": "Asset Management",
  "region": "prod",
  "appType": "CodeApp",
  "environmentId": "8593d72e-7626-ead7-84be-5bb97af773d8",
  "buildPath": "./dist",
  "buildEntryPoint": "index.html",
  "localAppUrl": "http://localhost:3000",
  "databaseReferences": {
    "default.cds": {
      "dataSources": {}
    }
  }
}
```

---

## 🗄️ 3. Creating Dataverse Tables & Importing into React

### Step 1: Create Solution & Tables in Power Apps Studio
Go to [make.powerapps.com](https://make.powerapps.com) and create a solution (e.g., `Asset Management`).
Add the following tables with your solution publisher prefix (e.g. `cr240`):

| Logical Table Name | Display Name | Purpose |
| :--- | :--- | :--- |
| **`cr240_asset`** | Hardware Asset | Physical inventory (Laptops, Monitors, Phones, etc.). |
| **`cr240_assetrequest`** | Asset Request | Hardware requests raised by employees. |
| **`cr240_assetassignment`**| Asset Assignment| Custody records linking assets to employees. |
| **`cr240_assetmaintenance`**| Asset Maintenance| Repair and maintenance log for assets. |
| **`cr240_assetcategory`** | Asset Category | Lookup categories (e.g., Laptop, Mobile, Peripheral). |
| **`cr240_location`** | Facility Location| Physical locations (e.g., HQ - Floor 3, Remote). |

---

### Step 2: Add Tables to Code App Data Sources
Run the Power Platform CLI to generate TypeScript schemas and data source mappings:
```bash
pa app add-data-source --table "cr240_asset"
pa app add-data-source --table "cr240_assetrequest"
pa app add-data-source --table "cr240_assetassignment"
pa app add-data-source --table "cr240_assetmaintenance"
pa app add-data-source --table "cr240_assetcategory"
pa app add-data-source --table "cr240_location"
pa app add-data-source --table "systemuser"
```

This automatically generates:
- `.power/schemas/appschemas/dataSourcesInfo.ts`
- Typed models under `src/generated/models/`
- Service clients under `src/generated/services/`

---

### Step 3: Wrap Generated Services into Clean Application Services
Create clean wrapper services in `src/services/` to abstract Dataverse queries and transform field mappings:

```typescript
// Example: src/services/asset.service.ts
import { getClient } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';

export class AssetService {
  private static readonly client = getClient(dataSourcesInfo);

  static async getAllAssets(): Promise<AssetItem[]> {
    const res = await this.client.execute({
      dataSource: dataSourcesInfo.default_cds.dataSources.assets,
      dataverseRequest: {
        action: 'query',
        query: {
          select: ['cr240_assetid', 'cr240_name', 'cr240_serialnumber', 'cr240_status'],
          orderBy: ['createdon desc'],
        },
      },
    });

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch assets');
    }

    return res.data.map((item: any) => ({
      id: item.cr240_assetid,
      name: item.cr240_name,
      serialNumber: item.cr240_serialnumber,
      status: item.cr240_status,
    }));
  }
}
```

---

## 🔒 4. Role-Based Access Control (RBAC) & Security

### Key Concept: Dataverse is the Source of Truth
- We **do not** manage roles in the frontend.
- We **do not** store user roles in `localStorage`.
- The user's role is assigned in the **Power Platform Admin Center** / **Microsoft Entra ID**.

### The 4 Security Roles:
1. **`Asset Management - Employee`** → Basic access (view hardware, raise requests).
2. **`Asset Management - Manager`** → Approve / reject requests from team members.
3. **`Asset Management - Asset Administrator`** → Manage inventory, assignments, and repairs.
4. **`Asset Management - IT Administrator`** → Full administrative control over categories and locations.
5. **`No Role Assigned`** → Triggers full-screen **Access Denied** notice.

### How the Frontend Discovers Roles:
1. `UserContextService.getCurrentUser()` calls `getContext()` to get the Entra ID `objectId`.
2. `RoleResolutionService.resolvePrivileges()` queries Dataverse `RetrieveAadUserRoles` & `RetrieveUserPrivileges`.
3. `privilege-map.ts` maps Dataverse privileges (`prvReadcr240_asset`, `prvWritecr240_assetrequest`) into frontend `AppPermissions`.
4. `usePermission()` hook gates buttons, pages, and tabs.

---

## 🤖 5. How to Prompt AI Agents Efficiently for Code Apps

When working with AI coding assistants (like Google Antigravity, Claude, or Copilot) on Power Apps Code Apps, follow these best practices for high accuracy:

### Rule 1: Always State the Platform Context & Security Constraints
* ❌ *Bad Prompt:* "Add user roles to my React app."
  *(AI will build a custom role table in SQLite or store roles in localStorage).*
* ✅ *Good Prompt:* 
  > "This is a **Microsoft Power Apps Code App** using **Microsoft Dataverse**. Role-Based Access Control is already configured in Dataverse with 4 Security Roles: Employee, Manager, Asset Admin, and IT Admin. DO NOT create custom RBAC tables. Resolve roles using Dataverse `RetrieveUserPrivileges` and `@microsoft/power-apps/app` `getContext()`."

### Rule 2: Provide the Logical Schema Names & Publisher Prefix
* ❌ *Bad Prompt:* "Create the request service."
* ✅ *Good Prompt:*
  > "Create `src/services/request.service.ts` to query Dataverse table `cr240_assetrequest` using `@microsoft/power-apps/data` `getClient(dataSourcesInfo)`. Select fields `cr240_assetrequestid`, `cr240_title`, `cr240_priority`, `cr240_status`, and filter by current user's systemuserid."

### Rule 3: Efficient Prompt Template for New Features
```markdown
### TASK:
Implement [Feature Name] in the Power Apps Code App.

### ARCHITECTURE & CONSTRAINTS:
- Technology: React 19, TypeScript, Tailwind CSS v4, Power Apps SDK (@microsoft/power-apps/data).
- Backend: Microsoft Dataverse.
- Dataverse Table: [e.g. cr240_assetmaintenance]
- Security Gate: Require permission AppPermissions.MANAGE_MAINTENANCE using usePermission().

### EXPECTED BEHAVIOR:
1. Fetch records via [Service Name].
2. Provide a responsive table with sticky header and pinned pagination.
3. Validate required fields before submitting to Dataverse.
```

---

## 🐞 6. Step-by-Step Debugging Guide

### 1. Debugging User Identity & Roles
Open browser Developer Tools (`F12`) → **Console** tab. Look for `[RoleResolution]` logs:
```text
[RoleResolution] Direct & Team Roles from Dataverse: ["Asset Management - Employee"]
[RoleResolution] Received 32 privileges: ["prvReadcr240_asset", "prvCreatecr240_assetrequest"]
[RoleResolution] Resolved permissions count: 3 assigned roles: ["Asset Management - Employee"] → final display role: Asset Management - Employee
```

### 2. Common Errors & Fixes

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **"Access Denied: No Dataverse Security Role Assigned"** | The signed-in Entra user has no role in Power Platform. | Go to Power Platform Admin Center → Environment → Users → Assign Security Role. |
| **Dataverse 403 (Forbidden)** | UI allowed a button click, but the user's role lacks Table Privilege in Dataverse. | Edit Security Role in Solution Explorer → Grant Read/Write on that entity. |
| **Dataverse 404 (Entity Not Found)** | Table logical name mismatch in `dataSourcesInfo.ts`. | Check `power.config.json` entity set name and run `pa app add-data-source`. |
| **Local SDK Warning ("Running outside Power Apps host")** | `getContext()` uses mock/fallback when running standalone. | Launch using `pa app run` so the Power Apps proxy injects runtime context. |

---

## ⚡ 7. Commands Reference: Run, Build, Push

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally with Live Dataverse Proxy
```bash
pa app run
```
*Note: This starts the Vite dev server and links it with your authenticated Dataverse session.*

### 3. Build Production Bundle
```bash
npm run build
```
*Executes TypeScript compiler (`tsc -b`) and outputs optimized assets into `./dist`.*

### 4. Push / Deploy to Power Apps
```bash
pa app push
```
*Uploads the built `./dist` package directly to your Power Apps Code App instance in Dataverse.*

### 5. Code Linting & Verification
```bash
npm run lint
```
