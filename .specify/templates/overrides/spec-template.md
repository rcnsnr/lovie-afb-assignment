# Feature Specification

## Summary

Describe the feature in plain language.

## Goals

- ...

## Non-Goals

- ...

## Actors

- ...

## Primary Flows

- ...

## Screens / Views

- ...

## Domain Rules

- ...

## Money Handling Rules

- values stored as integer minor units
- no floating-point persisted money
- positive amount validation required

## Request Lifecycle

State model:

- PENDING
- PAID
- DECLINED
- CANCELLED
- EXPIRED

Allowed transitions:

- PENDING -> PAID
- PENDING -> DECLINED
- PENDING -> CANCELLED
- PENDING -> EXPIRED

## Authorization Rules

- who can view
- who can act
- who can cancel
- what share links can and cannot do

## Expiration Semantics

- countdown display rules
- server-side source of truth
- post-expiration behavior

## Validation Rules

- input validation
- note constraints
- contact format rules
- action preconditions

## Error States

- ...

## Edge Cases

- ...

## Acceptance Criteria

- ...

## Reviewer Notes

- assumptions
- intentional simplifications
- prototype-grade boundaries
