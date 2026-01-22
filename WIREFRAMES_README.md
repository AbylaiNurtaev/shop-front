# Mobile Wireframes - Admin Panel

## Overview
This document describes the mobile wireframe system created for the admin panel.

## Design Principles

### Mobile-First Approach
- One screen = one primary task
- No desktop layout reuse
- No tables on mobile
- No horizontal scrolling
- Single content column
- Clear visual hierarchy

### Visual Elements
- Grayscale only (no colors)
- No icons, no images
- Box and text placeholders
- Focus on structure and usability

## Screen Specifications

### 1. Login
**Purpose**: User authentication
**Components**:
- Page title
- Email input field
- Password input field
- Primary action button: "Login"
- Secondary links (forgot password, register)

**Flow**: Login → Role Selection OR Main App

---

### 2. Registration - Role Selection
**Purpose**: Choose user type
**Components**:
- Page title
- Two large selection buttons:
  - Store Owner (with description)
  - Brand/Distributor (with description)
- Back link

**Flow**: Role Selection → Store Registration OR Brand Registration

---

### 3. Products List
**Purpose**: View all products
**Components**:
- Sticky header with title
- Primary action: "Create Product" (full-width button)
- Search input (full-width)
- Vertical list of product cards:
  - Product name
  - SKU
  - Stock status badge
  - Category
  - Weight/Volume
  - Edit/Delete actions
- Bottom navigation (fixed)

**Flow**: Products List → Product Edit

---

### 4. Product Details / Edit
**Purpose**: Create or edit product
**Components**:
- Sticky header with title + close button
- Scrollable form with vertical field stack:
  - Product name
  - Category selector
  - SKU (with auto-generate option)
  - Quantity
  - Units per box
  - Weight
  - Volume
- Sticky bottom actions:
  - Cancel button
  - Save button

**Flow**: Product Edit → Products List

---

### 5. Inventory Overview
**Purpose**: Monitor stock levels
**Components**:
- Sticky header with title
- Three summary cards (vertical):
  - In Stock (total units)
  - Low Stock (count)
  - Out of Stock (count)
- Search input
- Inventory item cards:
  - Product name/SKU
  - Current quantity display
  - Quick adjustment buttons (+/-)
  - Edit button
- Bottom navigation (fixed)

**Flow**: Inventory Overview → Inventory Update

---

### 6. Inventory Item Update
**Purpose**: Update single product quantity
**Components**:
- Product name
- SKU/Category
- Large current quantity display
- Quantity adjustment controls:
  - Minus button
  - Number input
  - Plus button
- Primary action: "Update Quantity"
- Cancel button

**Flow**: Inventory Update → Inventory Overview

---

### 7. Categories List
**Purpose**: Manage category structure
**Components**:
- Sticky header with title
- Primary action: "Add Category"
- Vertical category cards:
  - Parent category with expand/collapse button
  - Child count badge
  - Edit/Delete actions
  - Nested child categories (when expanded)
- Bottom navigation (fixed)

**Flow**: Categories List → Add Category

---

### 8. Add Category
**Purpose**: Create new category
**Components**:
- Sticky header with title + close button
- Form fields:
  - Category name input
  - Parent category selector (optional)
  - Helper text
- Info box explaining hierarchy
- Sticky bottom actions:
  - Cancel button
  - Create button

**Flow**: Add Category → Categories List

---

## Navigation Structure

### Bottom Navigation (Fixed)
Present on all main screens:
- Products (icon + label)
- Inventory (icon + label)
- Categories (icon + label)
- Logout (icon + label)

**Active State**: Filled background on current screen

---

## Interaction Patterns

### Buttons
- **Primary Actions**: Full-width, high contrast
- **Secondary Actions**: Outlined, side-by-side with primary
- **Icon Buttons**: Square, consistent size (44x44px minimum)

### Forms
- **Input Fields**: Full-width, consistent height (48px)
- **Labels**: Above inputs, left-aligned
- **Helper Text**: Below inputs, smaller size

### Cards
- **Product Cards**: Border, padding, clear sections
- **Summary Cards**: Icon + metric display
- **List Items**: Expandable/collapsible for hierarchy

### Modals
- **Mobile**: Slide from bottom, full-width
- **Header**: Sticky with title + close
- **Actions**: Sticky bottom bar

---

## Touch Targets

All interactive elements meet minimum touch target size:
- **Minimum**: 44x44px (Apple HIG standard)
- **Recommended**: 48x48px for primary actions
- **Spacing**: Minimum 8px between targets

---

## Spacing System

- **Screen Padding**: 16px (1rem)
- **Card Padding**: 16px
- **Stack Gap**: 12-16px between form fields
- **Section Gap**: 24px between major sections

---

## Typography Hierarchy

- **Page Title**: Largest, bold
- **Section Headers**: Medium, semi-bold
- **Body Text**: Regular
- **Helper Text**: Small, muted
- **Labels**: Small, semi-bold

---

## Implementation Notes

1. All wireframes use grayscale boxes and text placeholders
2. No decorative elements or branding
3. Focus on structure, spacing, and usability
4. Designed for 375px mobile viewport
5. Vertical scrolling for overflow content
6. Fixed bottom navigation on all main screens
7. Sticky headers on scrollable screens
8. Modal forms slide from bottom on mobile