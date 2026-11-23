# Internal verifier SDK

The verifier gives every registered system a history that can't be quietly rewritten, plus an optional allow/deny check before risky steps. This file describes how it works, from the team that owns it, and how this project uses it.

## How it works

### 1. Setup (once per system)

- An admin registers the system with the validator and gives it a stable ID.
- The system gets an API key (proves who is sending) and a signing key pair. Only the public half of the signing key is registered.
- Optional: an IP allowlist, and policies assigned by an admin (for example "this action needs two approvers").
- The team links the SDK into the system's code.

### 2. Recording important steps

- When the system does something that matters, the SDK writes a block to the system's own chain: the action, its inputs and outputs (usually digests, not raw data), the approvers, and the hash of the previous block.
- The SDK sets the sequence number (from 0), logical clock, timestamp and hashes. The calling code cannot.
- If a step depends on another system's block, the block holds a reference to it, including that block's hash. This joins the chains.
- The SDK hashes the block, signs it and sends it to the validator.

### 3. Validator intake

The validator checks the API key and registration, that the system isn't suspended, the IP allowlist, the recomputed hash, that the block isn't a duplicate, the signature, that the block extends the stored chain, and that every referenced block exists. If every check passes, it stores the block and its references and notes arrival order. If any check fails, it rejects the block but still logs the attempt.

### 4. Checkpoints

The validator regularly issues a signed checkpoint that commits to every block received so far. When writing a block, the SDK fetches and verifies the latest checkpoint and cites it. If that fails, the block is still written, without the citation.

### 5. Later checks

- Validation runs (started by an auditor or on a schedule) look for edited blocks, bad signatures, missing or repeated sequence numbers, missing references, out-of-order dependencies, policy violations, and checkpoint problems.
- Notarization matching compares the validator's records with a full export from the system, to find anything recorded locally but never sent.
- Results are findings, each with a severity and the block concerned.

### 6. Optional pre-action check

Before a risky step, the system asks the validator whether it may proceed. The validator answers allow or deny with reasons and stores nothing.

## How this project uses it

| System | Blocks it writes | Pre-action check before | References |
| --- | --- | --- | --- |
| Agent service | Request received, each tool call, spec generated (digest + validation result), prepare_order | prepare_order and other risky tools | MCP server's or runtime's block for the same request |
| MCP server | Each Copilot tool call, each app tool call from the widget | Risky tools | None (start of the chain in Copilot mode) |
| Orders service | Preview, place, cancel | Place and cancel (policies such as two approvers above a limit) | Agent's prepare_order block, its own preview block |
| Domain read services (optional) | Reads that matter for audit | None | Agent's tool-call block |

## Rules for code in this repo

- Only the pre-action check can stop an action. Treat deny **and** timeout as "do not proceed" for risky actions (fail closed).
- Record the block after the action completes, with input and output digests. Never put raw balances, transactions or personal data in a block.
- Keep the API key and private signing key in the company secret manager (or HSM). Never in code, config files or logs.

## Open decisions

- Final list of "risky" actions.
- Whether the CopilotKit runtime and read-only domain services register as systems.
- Key storage location and rotation owner.
