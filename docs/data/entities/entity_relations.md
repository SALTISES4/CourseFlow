# Entity Relations

This file captures the current high-level relation set that is already in scope for the rebuild.

It is intentionally high-level and should be refined only from ratified model decisions.

## Core Ownership

- a user owns many projects
- a user owns many workflows
- a project contains many workflows

## Project Classification

- a project may be associated with many disciplines
- a discipline may classify many projects

## Workflow Structure

- a workflow contains many sections
- a workflow has one unit
- a workflow may contain many channels

## Section / Channel / Node

- a section contains many nodes
- a channel contains many nodes

## Graph Structure

- a node may connect to many outcomes
- a node may have many edges
- a node may be associated to a unit where that relation is defined by the canonical model

## Outcome Structure

- an outcome belongs to a workflow
- an outcome has one thread
- an outcome may link to other outcomes where that self-relation is defined by the canonical model

## User Interaction / Secondary Relations

- comments are owned by users
- notifications belong to users
- favorite projects belong to users
- favorite workflows belong to users
- project-team membership links users into projects where that join model applies

## Current Documentation Rule

This file is a human-oriented summary.

The canonical field-level and cardinality-level model should live in the entity source document once that file is formalized for the new repository.
