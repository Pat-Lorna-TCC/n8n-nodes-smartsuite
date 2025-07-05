---
trigger: always_on
---

# SmartSuite API Integration Rules - Part 1

## Notes
SmartSuite's API is built on Django REST Framework, so every endpoint path must end with a trailing slash. For example:
- ✅ `/solutions/` (correct)
- ❌ `/solutions` (incorrect)

All endpoints in this document are shown with their required trailing slashes.

## Table of Contents
- [Introduction](#introduction)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)


## Introduction

[Official SmartSuite API Documentation](https://developers.smartsuite.com/docs/intro)
Base URL: https://app.smartsuite.com/api/v1

SmartSuite provides a comprehensive API for interacting with solutions, tables, and records. This document outlines the standards and best practices for working with the SmartSuite API in our n8n integration.

## Authentication

[Authentication Documentation](https://developers.smartsuite.com/docs/authentication)

1. **API Keys**
   - Store API keys in environment variables
   - Use the format `SMARTSUITE_API_KEY`
   - Never commit API keys to version control

2. **Request Headers**
   ```typescript
   {
     // Required: Bearer token for authentication
     'Authorization': `Bearer ${apiKey}`,
     
     // Required: Your SmartSuite workspace ID
     // Can be found in your SmartSuite account settings
     'Account-Id': 'your-workspace-id',
     
     // Required for POST/PUT requests with a body
     'Content-Type': 'application/json',
     
     // Recommended to ensure JSON responses
     'Accept': 'application/json'
   }
   ```

3. **Credentials Setup**
   When setting up the SmartSuite credentials in n8n:
   - The `apiKey` is your SmartSuite API key
   - The `accountId` corresponds to the `Account-Id` header value
   - Both are required for all API requests

## API Endpoints

### Solutions

- [Solution Object](https://developers.smartsuite.com/docs/solution-data/solutions/solution-object)
- [List Solutions](https://developers.smartsuite.com/docs/solution-data/solutions/list-solutions)
- [Get Solution](https://developers.smartsuite.com/docs/solution-data/solutions/get-solution)

### Records
- [Table Object](https://developers.smartsuite.com/docs/solution-data/tables/table-object)
- [List Tables](https://developers.smartsuite.com/docs/solution-data/tables/list-tables)
- [Get Table](https://developers.smartsuite.com/docs/solution-data/tables/get-table)
- [Create Table](https://developers.smartsuite.com/docs/solution-data/tables/create-table)

### Fields
- [Field Types and Properties](https://developers.smartsuite.com/docs/solution-data/fields/field-types)
- [Field Object](https://developers.smartsuite.com/docs/solution-data/fields/field-object)
- [Add Field](https://developers.smartsuite.com/docs/solution-data/fields/add-field)
- [Update Field](https://developers.smartsuite.com/docs/solution-data/fields/update-field)
- [Delete Field](https://developers.smartsuite.com/docs/solution-data/fields/delete-field)

### Org Management

#### Members
- [Member Object](https://developers.smartsuite.com/docs/org_management/members/member-object)
- [List Members](https://developers.smartsuite.com/docs/org_management/members/list-members)
  POST /members/list/

#### Teams
- [Teams Object](https://developers.smartsuite.com/docs/org_management/teams/team-object)
- [List Teams](https://developers.smartsuite.com/docs/org_management/teams/list-teams)
  POST /teams/list/

### Current User
- [Get Current User Info](https://developers.smartsuite.com/reference/getusersme)
  ```http
  GET /users/me/
  ```
  Returns information about the currently authenticated user.

  **Example Response:**
  ```json
  {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
  ```