# n8n-nodes-smartsuite

This is an n8n community node for SmartSuite. It allows you to interact with SmartSuite's API to manage resources across your SmartSuite solutions. **v2.0.0**.
This a major rewrite based on n8n recommendation to use the Airtable node as a template.

## Features

- CRUD operations for **Record**, **Table**, **Solution**, and **Org Management** resources
- Generic **API Request** actions (Get, Post, Put, Patch, Delete)
- Support for n8n Return All/Limit pagination pattern
- AI Agent tool integration
- Improved date field handling for due_date fields

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Usage

### Resources & Operations

#### Record
- Get Record
- List Record
- Search Record
- Create Record
- Update Record
- Upsert Record
- Delete Record

#### Table
- List Tables
- Get Table
- Create Table Field
- Create Table

#### Solution
- List Solution
- Get Solution

#### Org Management
- Get Current User
- List Members
- List Teams

#### API Request
- Get
- Post
- Put
- Patch
- Delete

#### Trigger Actions
- On new or updated record

### As a Regular Node

Each resource operation is exposed as an action within the SmartSuite node. Simply select the desired **Resource** and **Operation**, provide any required parameters, and execute.

### As an AI Agent Tool

This node integrates seamlessly with the n8n AI Agent node. When used as a tool, the AI Agent will recognize the SmartSuite methods and their capabilities.

### As a Trigger

This node can be used as a trigger to poll for new or updated records in SmartSuite.

## Record 
- **Get Record**: Retrieve a specific record by its ID.
- **List Record**: Return one or more records from a table, with support for Return All/Limit pagination.
- **Search Record**: Find records using multiple filters, supporting various field types, operators, and AND/OR logic.
- **Create Record**: Create a new record with specified field values.
- **Update Record**: Update one or more fields on an existing record by ID.
- **Upsert Record**: Create or update a record based on a filter (if found, it updates; otherwise, it creates).
- **Delete Record**: Delete a record by its ID.

## Table
- **List Tables**: List all tables in a workspace or solution.
- **Get Table**: Retrieve metadata for a specific table by ID.
- **Create Table Field**: Add a new field/column to an existing table.
- **Create Table**: Create a new table in the workspace or solution.

## Solution
- **List Solution**: List all solutions available to the API key.
- **Get Solution**: Retrieve details for a specific solution by ID.

## Org Management
- **Get Current User**: Fetch details about the authenticated user.
- **List Members**: List all members in the organization, with pagination support.
- **List Teams**: List all teams within the organization.

## API Request
- **Get**: Perform a generic GET request to any SmartSuite API endpoint.
- **Post**: Perform a generic POST request to any SmartSuite API endpoint.
- **Put**: Perform a generic PUT request to any SmartSuite API endpoint.
- **Patch**: Perform a generic PATCH request to any SmartSuite API endpoint.
- **Delete**: Perform a generic DELETE request to any SmartSuite API endpoint.

#### Tool Response Format

We are using the n8n Return All/Limit pagination pattern.

## Credentials

To use this node, you'll need to set up your SmartSuite API credentials:

1. Log in to your SmartSuite account
2. Go to Settings > API
3. Generate a new API key
4. In n8n, add your SmartSuite credentials:
   - **API Key**: Your SmartSuite API key
   - **Base URL**: `https://app.smartsuite.com/api/v1`

## Security & Compliance

### Known Vulnerabilities

This node has some known security vulnerabilities in its dependencies:

1. **High Severity**: Axios SSRF and Credential Leakage Vulnerability
   - Affects: `axios` package (transitive dependency)
   - Impact: Potential Server-Side Request Forgery (SSRF) and credential leakage
   - Mitigation: This vulnerability only affects requests to untrusted URLs. The SmartSuite node only makes requests to the SmartSuite API (a trusted domain) and handles credentials securely through n8n's credential system.

### Security Best Practices

1. **API Key Management**
   - Never share your SmartSuite API key
   - Use n8n's credential system to store your API key securely
   - Rotate your API key if you suspect it has been compromised

2. **Data Access**
   - Only grant the minimum required permissions to your SmartSuite API key
   - Review your SmartSuite audit logs regularly for suspicious activity
   - Use the principle of least privilege when setting up API access

3. **Network Security**
   - Ensure your n8n instance is running behind a secure network
   - Use HTTPS for all API communications
   - Keep your n8n instance and its dependencies up to date

### Reporting Security Issues

If you discover a security vulnerability in this node, please report it responsibly:

1. Do not create public issues for security vulnerabilities
2. Email security details to: [patandlorna@patandlorna.com](mailto:patandlorna@patandlorna.com)
3. Include a detailed description and steps to reproduce

We will respond to security reports A.S.A.P.

## Resources

- [SmartSuite API Documentation](https://developers.smartsuite.com/docs/intro)
- [n8n Main Website](https://n8n.io/)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n AI Functionality Documentation](https://docs.n8n.io/advanced-ai/)

## License

MIT License - see the [LICENSE](LICENSE) file for details