---
trigger: always_on
---

# n8n Creating Custom Nodes

## Starter repo
https://github.com/n8n/n8n-nodes-starter.git

## Creating Node
https://docs.n8n.io/integrations/creating-nodes/overview

## Choose your node building approach
https://docs.n8n.io/integrations/creating-nodes/plan/choose-node-method

## Set up your development environment
https://docs.n8n.io/integrations/creating-nodes/plan/setup-development-environment


## Build a declarative-style node
https://docs.n8n.io/integrations/creating-nodes/plan/build-declarative-node

## Declarative-style parameters
https://docs.n8n.io/integrations/creating-nodes/build/reference/node-base-files/declarative-style-parameters

## UX guidelines for community nodes
https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines

## Community nodes verification guidelines
https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/

## Node versioning
https://docs.n8n.io/integrations/creating-nodes/build/reference/node-versioning

## Programmatic-Style Nodes
Use Cases: Required for trigger nodes, non-REST integrations, modules, or whenever you need fine-grained control in an execute() method .

Structure: Implement INodeType, provide description: INodeTypeDescription, and write an async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> method to process input items and return outputs.

## Packing & Publishing
Starter Repository: Use the n8n-nodes-starter GitHub template as your baseline. It includes example nodes, linter setup, and recommended project structure 
GitHub.

NPM Packaging: Update package.json, build your dist, and publish to npm under an n8n-nodes-<your-integration> name to share with the community 
GitHub.

Linking Locally: For local testing, link your package into ~/.n8n/custom (or use npm link/pnpm link) so n8n can discover and load your nodes on startup.

## 
https://www.npmjs.com/package/n8n-node-dev