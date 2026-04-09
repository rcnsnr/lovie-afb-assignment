# Change Impact and Validation

## Purpose

Define the minimum review and validation discipline for every mutating change in this repository.

## Impact Surface

Every meaningful change should declare one or more impact surfaces:

- runtime_logic
- public_interface
- authorization
- money_handling
- request_lifecycle
- expiration_behavior
- search_filter_behavior
- docs_and_evidence
- deployment_readiness

## Validation Receipt

Every meaningful change should produce a small validation receipt containing:

- changed files
- expected behavior
- executed commands
- test or evidence produced
- exceptions or things intentionally not covered

Silent omission is forbidden.

## Minimum Verification

### runtime_logic

- targeted tests or smoke path
- manual confirmation of changed behavior

### public_interface

- UI or API confirmation
- no broken navigation or interaction path

### authorization

- verify allowed actor
- verify blocked actor
- verify state-changing actions are protected

### money_handling

- confirm integer minor-unit storage
- confirm validation and display logic

### request_lifecycle

- confirm allowed transitions only
- confirm terminal states are terminal

### expiration_behavior

- confirm server-side enforcement
- confirm UI countdown is display-only

### docs_and_evidence

- update assumptions if behavior changed
- update AI process notes if workflow changed
- update build notes when manual decisions matter

### deployment_readiness

- confirm demo path works
- confirm environment assumptions are documented
- confirm E2E evidence still aligns with deployed behavior

## Guard Rules

- “I only ran the nearest test” is not sufficient by default
- a visible patch without validation is not enough
- if behavior changed, evidence must exist
- if validation did not run, say so explicitly
- if a shortcut was used, document the tradeoff
