# Asset Management Code App -- Dataverse Security & RBAC Guide

## Purpose

This guide explains how **Dataverse Security Roles, Table Privileges,
Access Levels, Business Units, Teams, and Power Apps Code Apps** work
together to implement RBAC.

> **Core principle:** React controls the user experience; Dataverse
> controls authorization.

------------------------------------------------------------------------

## 1. Authentication vs Authorization

### Authentication --- Who are you?

A Power Apps Code App can retrieve the signed-in user's context using:

``` ts
import { getContext } from "@microsoft/power-apps/app";

const ctx = await getContext();

console.log(ctx.user.objectId);
console.log(ctx.user.userPrincipalName);
```

`getContext()` provides user information such as `fullName`, `objectId`,
`tenantId`, and `userPrincipalName`.

**Important:** `getContext()` does not directly provide Dataverse
security roles. The user's `objectId` can be used with supported
Dataverse APIs to obtain security information.

### Authorization --- What can you do?

Dataverse Security Roles define the privileges and access levels that
determine what a user can do with Dataverse data.

``` text
Authentication → Who are you?
Authorization  → What can you do?
```

------------------------------------------------------------------------

## 2. What Is a Security Role?

A Security Role is a collection of Dataverse permissions.

Example roles for Asset Management:

``` text
Asset Management - Employee
Asset Management - Manager
Asset Management - IT Administrator
Asset Management - Asset Administrator
```

A role is **not simply a screen name**. It defines permissions over
Dataverse data.

Example:

``` text
Employee Role

Asset:
  Read   → Business Unit
  Create → User
  Write  → User
  Delete → None
```

------------------------------------------------------------------------

## 3. What Is a Table Privilege?

A privilege represents an operation:

  Privilege   Meaning
  ----------- ---------------------------------------
  Create      Create a record
  Read        Read records
  Write       Modify records
  Delete      Delete records
  Append      Associate one record with another
  Append To   Allow another record to be associated
  Assign      Change record ownership
  Share       Share a record

Think:

``` text
Privilege = WHAT operation is allowed
Access Level = HOW BROADLY it is allowed
```

So:

``` text
Read + Organization
```

is very different from:

``` text
Read + Business Unit
```

------------------------------------------------------------------------

## 4. Access Levels

For user/team-owned tables, the common access scopes are:

``` text
User / Basic
    ↓
Records owned by or available to the user

Business Unit / Local
    ↓
Records within the relevant Business Unit

Parent: Child / Deep
    ↓
Current Business Unit + child Business Units

Organization / Global
    ↓
Records across the organization

None
    ↓
No access
```

The exact options shown depend on the table ownership/security model.

### User / Basic

Example:

``` text
Asset → Read → User
```

This is a narrow record-level scope based on ownership, team ownership,
or sharing rules.

### Business Unit / Local

A Business Unit is a logical security boundary.

Example:

``` text
Company
├── Chennai BU
└── Bangalore BU
```

If a user has:

``` text
Asset → Read → Business Unit
```

the intent is access within the applicable Business Unit rather than
automatically across the entire organization.

### Parent: Child / Deep

For a hierarchy:

``` text
Company
├── South India
│   ├── Chennai
│   └── Coimbatore
└── North India
    ├── Delhi
    └── Noida
```

Parent: Child access can cover the user's Business Unit and descendant
Business Units.

### Organization / Global

``` text
Asset → Read → Organization
```

provides organization-wide scope.

Conceptually:

``` text
Chennai    → Yes
Bangalore  → Yes
Delhi      → Yes
Dubai      → Yes
```

Use this carefully and follow least privilege.

> **Organization = broadest normal scope. Business Unit = a narrower
> organizational security boundary.**

------------------------------------------------------------------------

## 5. Business Unit Is Not a Security Role

Keep these concepts separate:

``` text
Business Unit
    ↓
Where the user/data is organized

Security Role
    ↓
What permissions the user has

Privilege
    ↓
What operation is allowed

Access Level
    ↓
How broadly that operation applies
```

Example:

``` text
Jeevan
  ↓
Chennai Business Unit
  ↓
Employee Security Role
  ↓
Asset: Read
  ↓
Business Unit access
```

------------------------------------------------------------------------

## 6. Multiple Roles and Teams

A user can have multiple security roles, and their privileges are
cumulative.

Example:

``` text
Jeevan
├── Employee role (direct)
└── IT Team
    └── IT Administrator role
```

The user can receive privileges from both direct roles and
team-associated roles.

Therefore, do not assume:

``` ts
role === "Employee"
```

is the complete security picture.

For authorization decisions, think in terms of **effective
privileges/capabilities**, not only a single role name.

------------------------------------------------------------------------

## 7. Code App RBAC Architecture

Recommended architecture:

``` text
Microsoft Entra ID
      ↓
Authenticated user
      ↓
Power Apps Code App
      ↓
getContext()
      ↓
User objectId
      ↓
Dataverse security APIs
      ↓
Applicable roles / privileges
      ↓
Effective capabilities
      ↓
React UI
```

The React UI can use the effective security information to improve the
experience:

``` text
Employee
  → Show Assets
  → Show Create Request
  → Hide/disable Delete

Manager
  → Show Manager Approvals

IT Administrator
  → Show asset administration features
```

But these UI decisions are **not the security boundary**.

------------------------------------------------------------------------

## 8. UI Authorization vs Real Authorization

### React

React answers:

``` text
Should I show this button?
Should I show this navigation item?
Should this action be disabled?
```

### Dataverse

Dataverse answers:

``` text
Can this user actually create the record?
Can this user read it?
Can this user update it?
Can this user delete it?
```

If React accidentally displays a Delete button, Dataverse should still
reject the Delete operation when the user lacks the required privilege.

> **React = UX. Dataverse = security.**

------------------------------------------------------------------------

## 9. Should We Create Our Own Role Table?

For a normal Dataverse-based Code App, do not automatically replace
Dataverse Security Roles with custom tables such as:

``` text
Roles
UserRoles
Permissions
RolePermissions
```

That creates a second authorization system which can disagree with
Dataverse.

The native Dataverse model already provides:

``` text
Security Roles
+ Privileges
+ Access Levels
+ Teams
+ Business Units
+ Record-level security
```

A custom application permission model can still be useful for **business
rules that are not the same as data authorization**.

Example:

``` text
Dataverse Security:
Can the user update this Asset?

Application rule:
Can this Manager approve a request above ₹50,000?
```

So an enterprise app may use:

``` text
Dataverse Security
        +
Application Business Rules
```

but custom tables should not normally replace Dataverse's fundamental
data security.

------------------------------------------------------------------------

## 10. Principle of Least Privilege

Give users only the access required for their job.

Example:

If an employee only needs to read assets within their Business Unit:

``` text
Read → Business Unit
```

may be more appropriate than:

``` text
Read → Organization
```

If they do not need Delete:

``` text
Delete → None
```

Do not grant broader privileges simply because they are convenient.

------------------------------------------------------------------------

## 11. Example Role Design

### Employee

Possible requirement:

> View relevant assets and create asset requests, but cannot delete
> assets.

Example:

``` text
Asset:
  Read   → Business Unit
  Write  → User/None
  Delete → None

Asset Request:
  Read   → User/Business Unit
  Create → User
  Write  → User
  Delete → None
```

### IT Administrator

Possible requirement:

> Manage assets across the organization.

Example:

``` text
Asset:
  Read   → Organization
  Create → Organization
  Write  → Organization
```

Whether Delete, Assign, Share, or other broad privileges are required
must be decided from the client's actual security requirements.

------------------------------------------------------------------------

## 12. Debugging RBAC Problems

If the UI shows:

``` text
IT Administrator
```

while the Admin Center shows:

``` text
Employee
```

do not immediately hardcode Employee in React.

Check:

1.  `getContext().user.objectId`
2.  Dataverse user
3.  Direct security roles
4.  Team memberships
5.  Team security roles
6.  `RetrieveAadUserRoles` / privilege APIs
7.  React Context/state
8.  localStorage/sessionStorage
9.  Hardcoded role mappings
10. Cached API responses

A user can legitimately receive an additional role through a team.

------------------------------------------------------------------------

## 13. Recommended Development Rules

Avoid:

``` ts
if (role === "Admin") {
  allowDelete();
}
```

Prefer a capability-oriented UI model:

``` ts
if (permissions.asset.delete) {
  showDeleteAction();
}
```

The actual Dataverse operation must still be enforced by Dataverse.

Why?

``` text
Multiple roles
+
Team roles
+
Cumulative privileges
+
Different access levels
=
Effective access
```

A role name alone does not fully describe effective access.

------------------------------------------------------------------------

## 14. Team Checklist

Before implementing RBAC in a Code App:

-   [ ] Identify business roles.
-   [ ] Identify Dataverse tables.
-   [ ] Identify required operations.
-   [ ] Decide access level for each operation.
-   [ ] Understand Business Unit structure.
-   [ ] Create/configure Security Roles.
-   [ ] Assign roles to users or teams.
-   [ ] Test direct and team-inherited roles.
-   [ ] Retrieve authenticated user context.
-   [ ] Determine effective privileges.
-   [ ] Use privileges/capabilities for UI behavior.
-   [ ] Let Dataverse enforce actual authorization.
-   [ ] Test unauthorized data operations.
-   [ ] Follow least privilege.
-   [ ] Never rely on hidden React buttons as security.

------------------------------------------------------------------------

## 15. Final Mental Model

``` text
Authentication
    = Who are you?

Security Role
    = What permissions are assigned?

Privilege
    = What operation can you perform?

Access Level
    = How broadly can you perform it?

Business Unit
    = Which organizational security boundary applies?

Team
    = Can provide additional roles/privileges to members.

Dataverse
    = Final authorization authority.

React
    = UI/UX representation of effective permissions.
```

### One sentence to remember

> **Entra ID tells us who the user is; Dataverse Security Roles and
> Privileges determine what the user can do; React reflects those
> permissions in the UI.**

------------------------------------------------------------------------

## 16. Official Microsoft References

-   Security roles and privileges for Dataverse\
    https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges

-   Security concepts for developers --- Microsoft Dataverse\
    https://learn.microsoft.com/en-us/power-apps/developer/data-platform/security-concepts

-   Get context data --- Power Apps Code Apps\
    https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/retrieve-context

-   Assign security roles\
    https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles

-   Configure user security in an environment\
    https://learn.microsoft.com/en-us/power-platform/admin/database-security-configure

-   How access to a record is determined\
    https://learn.microsoft.com/en-us/power-platform/admin/how-record-access-determined

-   Security concepts in Microsoft Dataverse\
    https://learn.microsoft.com/en-us/power-platform/admin/wp-security-cds

-   Create or edit a security role\
    https://learn.microsoft.com/en-us/power-platform/admin/create-edit-security-role

------------------------------------------------------------------------

## Final Recommendation for This Project

Use:

``` text
Dataverse Security Roles
        +
Table Privileges
        +
Access Levels
        +
Teams / Business Units
        +
Code App user context
        +
Effective privilege-based UI
```

as the authorization foundation.

Do **not** build a second custom role/permission system unless the
client has a genuine application-specific business requirement that
Dataverse security does not model well.


---

# 17. Source-Validated Notes for New Learners

This guide has been checked against current Microsoft Learn documentation. A few details are important enough to call out explicitly.

### 17.1 Microsoft terminology vs simplified terminology

Microsoft developer documentation commonly uses these access-level names:

| Power Platform UI concept | Microsoft developer terminology |
|---|---|
| User | Basic |
| Business Unit | Local |
| Parent: Child Business Unit | Deep |
| Organization | Global |
| None | None |

These are access-depth concepts. They should not be confused with the user's Business Unit itself.

For **organization-owned tables**, Microsoft notes that some privileges can only have Organization/Global or None access because those tables are not scoped by record ownership in the same way as user/team-owned tables.

Source: Microsoft Learn — Security concepts for developers (Dataverse):
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/security-concepts

### 17.2 Security roles are associated with Business Units

A Security Role is not simply a global label such as `Employee`.

Dataverse security roles are associated with Business Units. The role's privileges and access levels, together with the user's Business Unit, applicable teams, ownership, and sharing, contribute to effective access.

Source:
https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles

### 17.3 Multiple roles are cumulative

A user can have multiple Security Roles. Microsoft states that the privileges from multiple roles are cumulative.

Do not design the application assuming:

```text
one user = exactly one role
```

Also consider roles received through team membership.

Sources:
https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/security-concepts

### 17.4 Team roles matter

`RetrieveAadUserRoles` retrieves roles that an Entra/Azure AD user has through **direct assignment or team memberships**.

Therefore, if Admin Center appears to show one directly assigned role but the Code App finds another role, inspect team membership and team-associated roles before concluding that the frontend is wrong.

Source:
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveaaduserroles

### 17.5 Prefer effective privileges for authorization decisions

A role name is useful for display and administration, but it is not a complete description of access.

For Code App UI decisions, a capability model is usually safer:

```ts
permissions.asset.read
permissions.asset.create
permissions.asset.write
permissions.asset.delete
```

Dataverse remains the final authorization authority.

Microsoft also provides `RetrieveAadUserPrivileges` to retrieve privileges an Entra user has through direct roles or team memberships.

Source:
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveaaduserprivileges

### 17.6 Important limitation of RetrieveUserPrivileges

Microsoft documents an important nuance: `RetrieveUserPrivileges` can return team-inherited privileges only at Basic/user-level depth, even when the team's actual role grants a deeper access level.

If the application needs to determine the effective privilege depth for team-inherited privileges, Microsoft recommends the privilege-specific retrieval functions such as:

- `RetrieveUserPrivilegeByPrivilegeId`
- `RetrieveUserPrivilegeByPrivilegeName`

Source:
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveuserprivileges

### 17.7 Code App context does not directly contain roles

Current Power Apps Code Apps documentation lists these user-context properties:

```text
fullName
objectId
tenantId
userPrincipalName
```

It does not list a `roles` property.

Therefore, do not implement:

```ts
ctx.user.roles
```

unless Microsoft adds such a property in a future API version.

Use the authenticated user's `objectId` with the appropriate Dataverse security APIs.

Source:
https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/retrieve-context

---

# 18. Security Design Decision for This Project

For the Asset Management Code App, the recommended foundation is:

```text
Microsoft Entra ID
        ↓
Power Apps Code App context
        ↓
Dataverse Security Roles
        ↓
Table Privileges
        ↓
Access Levels
        ↓
Business Units / Teams / Ownership / Sharing
        ↓
Effective Dataverse Access
        ↓
React UI reflects capabilities
```

Do not create a custom React-only role system just to replace Dataverse Security Roles.

A custom application permission table can be added later for business rules that are genuinely outside normal Dataverse authorization, but it should not become the only protection for Dataverse data.

Microsoft describes Dataverse as using a role-based security model in which access levels and permissions in Security Roles determine how users can interact with apps and data.

Source:
https://learn.microsoft.com/en-us/power-platform/admin/database-security

---

# 19. Final Learning Rule

When designing any Code App authorization requirement, ask these questions in order:

```text
1. Who is the user?
   ↓
   Entra ID / getContext()

2. Which Dataverse roles apply?
   ↓
   Direct roles + team roles

3. What privilege is required?
   ↓
   Create / Read / Write / Delete / etc.

4. At what scope?
   ↓
   User / Business Unit / Parent:Child / Organization

5. What is the effective access?
   ↓
   Dataverse security evaluation

6. What should the UI show?
   ↓
   React reflects the effective capability

7. Is the operation actually secure?
   ↓
   Dataverse must enforce it
```

This is the mental model the team should use instead of thinking only in terms of:

```text
Admin → screen A
Manager → screen B
Employee → screen C
```

---

# 20. Primary Microsoft Learn Sources

Use these sources as the authoritative references for this project:

1. **Security roles and privileges for Dataverse**
   https://learn.microsoft.com/en-us/power-platform/admin/security-roles-privileges

2. **Role-based security roles for Dataverse**
   https://learn.microsoft.com/en-us/power-platform/admin/database-security

3. **Security concepts for developers — Microsoft Dataverse**
   https://learn.microsoft.com/en-us/power-apps/developer/data-platform/security-concepts

4. **How to get context data — Power Apps Code Apps**
   https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/retrieve-context

5. **Assign security roles**
   https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles

6. **RetrieveAadUserRoles**
   https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveaaduserroles

7. **RetrieveAadUserPrivileges**
   https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveaaduserprivileges

8. **RetrieveUserPrivileges**
   https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveuserprivileges

---

## Senior Developer Summary

> **Authentication identifies the user. Dataverse Security Roles define privileges. Access Levels define the scope of those privileges. Business Units and Teams participate in the security model. Dataverse calculates/enforces effective access. The Code App uses the resulting security context to provide the correct UI experience.**

For this project, **Dataverse-native RBAC is the correct starting architecture**. Do not replace it with a custom role table unless a specific client requirement needs an additional application-level permission model.
