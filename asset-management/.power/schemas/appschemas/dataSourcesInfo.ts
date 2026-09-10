/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "cr240_assetassignments": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_assetassignmentid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr240_assetcategories": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_assetcategoryid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr240_assetmaintenances": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_assetmaintenanceid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr240_assetrequests": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_assetrequestid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr240_assets": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_assetid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "cr240_locations": {
    "tableId": "",
    "version": "",
    "primaryKey": "cr240_locationid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {
      /**
       * Calls the Dataverse bound function:
       *   GET systemusers(<systemuserid>)/Microsoft.Dynamics.CRM.RetrieveUserPrivileges()
       *
       * Returns the effective cumulative set of Dataverse privileges for the user,
       * including privileges from all security roles and team memberships.
       *
       * @see https://learn.microsoft.com/power-apps/developer/data-platform/webapi/reference/retrieveuserprivileges
       */
      "RetrieveUserPrivileges": {
        "path": "api/data/v9.2/systemusers({systemUserId})/Microsoft.Dynamics.CRM.RetrieveUserPrivileges()",
        "method": "GET",
        "parameters": [
          {
            "name": "systemUserId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ]
      },
      /**
       * Calls the Dataverse unbound function:
       *   GET RetrieveAadUserRoles(DirectoryObjectId=<guid>)
       *
       * Returns the security roles assigned to an Entra ID user (both direct
       * and inherited via team memberships).
       *
       * @see https://learn.microsoft.com/power-apps/developer/data-platform/webapi/reference/retrieveaaduserroles
       */
      "RetrieveAadUserRoles": {
        "path": "api/data/v9.2/RetrieveAadUserRoles(DirectoryObjectId={directoryObjectId})",
        "method": "GET",
        "parameters": [
          {
            "name": "directoryObjectId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ]
      }
    }
  }
};
