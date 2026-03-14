# Dos ♦ Royale
A modern, casino‑inspired reimagining of the classic card game — built with React, TypeScript, Zustand, and a custom game engine.

## Overview
Dos Royale is a fast‑paced, strategic card game designed to capture the feel of real‑world play styles — from high‑roller casino tables to casual home gatherings. It blends a handcrafted game engine with a responsive, mobile‑first interface and a theme‑driven visual design system.

This repository serves as both a portfolio centerpiece and a fully playable multiplayer experience, showcasing front‑end engineering depth, state‑management discipline, and polished UI/UX execution.

## Key Features
### Custom Game Engine
Turn sequencing and authoritative state management

Combo detection and comparison logic

CPU opponents with multiple difficulty levels

Realistic timing and decision behavior

Written entirely in TypeScript — no external logic libraries

### Dynamic Theme System
Inspired by real casino environments:

Modern Vegas

Atlantic City

High Roller Suite

Home Game / Party Table

Themes influence:

Table felt

Accent colors

Glow effects

Modal styling

Button palette

### CPU Opponents
Easy / Normal / Hard difficulty

Thinking indicators

Human‑like timing and decision patterns

### Mobile‑First UI
Portrait‑optimized layout

Responsive seat placement

Smooth scaling across devices

Touch‑friendly interactions

### Multiplayer (Private Matches)
Host‑authoritative game flow

Real‑time sync via Firebase

Lobby system with ready states

Invite links for quick access

Turn updates, round transitions, and game‑over events

### Sound & Feedback
Card slap, pass, and combo audio cues

Theme‑aware sound design

Optional background music

## Tech Stack
React + TypeScript

Zustand for state management

Vite for build tooling

TailwindCSS for styling

Firebase Realtime Database for multiplayer sync

Custom game engine (no external logic libraries)

## Project Goals
Dos Royale is designed to demonstrate:

Front‑end engineering depth

UI/UX polish and responsive design

State‑management discipline

Real‑time multiplayer architecture

Product thinking and iterative refinement

Clean, readable, extensible code

It serves as a showcase of both technical skill and creative execution.

## Roadmap
Core Gameplay
[x] Game engine

[x] Turn sequencing

[x] Combo logic

[x] CPU logic v1

[x] Theme system

[x] Multiplayer (private matches)

[x] Sound design

Upcoming
[ ] Leaderboards & player stats

[ ] OAuth providers (Google, Apple, Discord)

[ ] Custom usernames with availability checks

[ ] Animations & transitions

[ ] Public matchmaking

[ ] CPU logic v2 (bluffing, risk profiles)

## Screenshots

### Gameplay — Private Match
A full multiplayer round with host‑authoritative state, CPU opponents, and real‑time turn sync.

<div align="center">
  <img src="screenshots/privatematch1.png" width="350" />
</div>

<div align="center">
  <img src="screenshots/gameover.png" width="350" />
</div>

---

### Theme System — Modern Vegas
Each theme dynamically updates table felt, accent colors, glow effects, and modal styling.

<div align="center">
  <img src="screenshots/themedemo.gif" width="350" />
</div>

---

### Mobile‑First Layout
Portrait‑optimized UI with responsive seat placement and smooth scaling across devices.

<div align="center">
  <img src="screenshots/mobile-layout.png" width="350" />
</div>

## Gameplay Preview

A quick look at a full turn cycle — dealing, selecting cards, CPU decisions, and round transitions.

<div align="center">
  <img src="screenshots/gameplay-demo.gif" width="350" />
</div>

## Architecture Overview

                       ┌──────────────────────────┐
                       │        React UI          │
                       │  Components / Screens    │
                       └─────────────┬────────────┘
                                     │
                                     ▼
                       ┌──────────────────────────┐
                       │       Zustand Store       │
                       │ gameStore / uiStore /     │
                       │ themeStore / audioStore   │
                       └─────────────┬────────────┘
                                     │
                                     ▼
                       ┌──────────────────────────┐
                       │       Game Engine         │
                       │ turnManager / combos /    │
                       │ CPU logic / validation    │
                       └─────────────┬────────────┘
                                     │
                                     ▼
                       ┌──────────────────────────┐
                       │ Firebase Realtime DB      │
                       │ lobby channel / sync      │
                       │ host-authoritative flow   │
                       └──────────────────────────┘

## How to run locally
### 1. Clone the repository
bash

git clone https://github.com/tgfaraon/dos-royale.git

cd dos-royale
### 2. Install dependencies
bash
npm install
### 3. Add environment variables
#### Code
VITE_FIREBASE_API_KEY=AIzaSyAM9FglTrUOnOau-YJUcwW--ERDObCyBxE
VITE_FIREBASE_AUTH_DOMAIN=dos-royale-aa48a.firebaseapp.com
VITE_FIREBASE_DB_URL=https://dos-royale-aa48a-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=dos-royale-aa48a
VITE_FIREBASE_STORAGE_BUCKET=dos-royale-aa48a.firebasestorage.app
VITE_FIREBASE_SENDER_ID=159731918017
VITE_FIREBASE_APP_ID=1:159731918017:web:3a12d66aa5f27d0a9ba040

### 4. Start the development server
bash
npm run dev
The application will be available at:

### Code
http://localhost:5173

---

## Author
### Tyler Faraon  
Curriculum architect, product owner, and full‑stack engineer focused on building polished, intentional digital experiences.
