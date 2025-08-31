# ClickUp Pricing Calculator

## Overview

This is a web-based pricing calculator specifically designed for ClickUp sales representatives. The application provides a guided wizard interface that walks sales reps through a structured process to generate customized pricing proposals for potential clients. The calculator handles multiple ClickUp plans, add-ons, user quantities, discounts, and implementation services, ultimately producing a professional PDF proposal using ClickUp's official branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a pure client-side architecture with vanilla HTML, CSS, and JavaScript - no frameworks or build tools required. This decision prioritizes simplicity and ease of deployment while maintaining full functionality.

**Key Components:**
- **Multi-step Wizard Interface**: Implements a 5-step guided process using a progress bar and step-based navigation
- **Live Pricing Summary**: Real-time calculation display in a right sidebar that updates as users make selections
- **PDF Generation**: Client-side PDF creation using jsPDF and html2canvas libraries
- **Responsive Layout**: Two-column desktop layout with mobile-friendly responsive design

### Data Management
All pricing data and business logic is stored in JavaScript configuration objects, making updates simple without requiring a backend database. The pricing rules, plan features, and validation logic are centralized in the CONFIG object within script.js.

**Pricing Structure:**
- **Plans**: Business Plus ($19/user/mo), Enterprise ($35/user/mo, 15 seat minimum), Enterprise Plus ($55/user/mo with AI included)
- **Add-ons**: ClickUp AI ($9/user/mo), ClickUp Notetaker ($10/user/mo), Implementation ($300/hr in 10-hour blocks)
- **Discount System**: Line-item percentage discounts applied separately to each component

### Business Logic
The application enforces several business rules:
- Enterprise plans require minimum 15 seats
- ClickUp AI is automatically included with Enterprise Plus and cannot be added separately
- Implementation hours must be in 10-hour increments with a 10-hour minimum
- Annual billing calculations with proper discount applications
- Quote expiration date validation

### PDF Generation System
Uses a custom HTML template (pdf-template.html) that matches ClickUp's official slide format. The system:
- Renders the template with calculated pricing data
- Converts HTML to canvas using html2canvas
- Generates PDF using jsPDF with proper sizing (10" x 5.625" slides)
- Downloads the completed proposal automatically

## External Dependencies

### JavaScript Libraries
- **jsPDF (v2.5.1)**: Client-side PDF generation functionality
- **html2canvas (v1.4.1)**: HTML to canvas conversion for PDF creation

### CDN Resources
Both libraries are loaded via CDN (cdnjs.cloudflare.com) to avoid local file management and ensure reliable access to the latest stable versions.

### Branding Assets
The application references ClickUp's official brand colors and styling, implemented through CSS custom properties for consistent theming throughout the interface.