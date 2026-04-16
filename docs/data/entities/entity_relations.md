# Entity Relations

This file captures the current high-level relation set that is already in scope for the rebuild.

It is intentionally high-level and should be refined only from ratified model decisions.

## Core Ownership

- a user owns many projects
- a user owns many graphs
- a project contains many graphs

## Project Classification

- a project may be associated with many disciplines
- a discipline may classify many projects

## Graph Structure

- a graph contains many sections
- a graph has one workflow
- a graph may contain many channels

## Section / Channel / Node

- a section contains many nodes
- a channel contains many nodes

## Graph Structure

- a node may connect to many outcomes
- a node may have many edges
- a node may be associated to a workflow where that relation is defined by the canonical model

## Outcome Structure

- an outcome belongs to a graph
- an outcome has one thread
- an outcome may link to other outcomes where that self-relation is defined by the canonical model

## User Interaction / Secondary Relations

- comments are owned by users
- notifications belong to users
- favorite projects belong to users
- favorite graphs belong to users
- project-team membership links users into projects where that join model applies

## Current Documentation Rule

This file is a human-oriented summary.

The canonical field-level and cardinality-level model should live in the entity source document once that file is formalized for the new repository.
