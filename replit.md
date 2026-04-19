# Kantoor Dashboard

## Overview
The Kantoor Dashboard is a comprehensive office management application designed to streamline various administrative and operational tasks within an organization. It features 9 core modules, robust permission management, and aims to centralize office operations for improved efficiency and communication. The project's vision is to provide a single source of truth for employees and management, fostering transparency and reducing manual overheads. Its market potential lies in any organization seeking an all-in-one solution for employee management, internal communication, and performance tracking.

## User Preferences
I want iterative development and clear communication. Please ask before making major architectural changes or decisions that impact the user experience significantly. I prefer detailed explanations for complex features or changes.

## System Architecture
The application is built using a modern full-stack architecture:
- **Frontend**: React with TypeScript, styled using Tailwind CSS and shadcn/ui components for a consistent and modern UI/UX. The design prioritizes clear navigation and responsive layouts. PageHero components are used across major modules for consistent branding and visual appeal, with images served statically from `uploads/App_pics/`.
- **Backend**: Express.js with TypeScript, providing a RESTful API.
- **Database**: PostgreSQL, managed with Drizzle ORM for type-safe database interactions.
- **Authentication**: Session-based authentication is implemented with secure bcrypt password hashing (12 rounds). Security features include Helmet middleware, rate limiting, and secure HTTP-only session cookies. Password reset is admin-initiated to prevent enumeration attacks.
- **Authorization**: Granular, module-level access control is managed via a `permissions` text array stored on user records. Roles include `directeur`, `admin`, `manager`, `manager_az`, and `employee`, each with predefined access levels and specific helper functions for advanced permissions (e.g., `isAdminRole()`, `canManageVacation()`).
- **Module Design**: The system is organized into eleven distinct modules: Dashboard, Evenementen Kalender, Aankondigingen, Organisatie, Personalia, Verzuim, Beloningen, Applicaties, Rapporten, Beheer, and Mijn Profiel. Each module addresses specific office functions, from event management and announcements to performance reviews and extensive reporting.
- **Key Features**:
    - **Event Management**: Supports various event categories, official holiday uploads, and notification badges.
    - **Announcements**: Features priority levels, pinning, PDF attachments, and direct messaging.
    - **Organizational Structure**: Manages departments, AO-Procedures (step-by-step instructions), an organogram, CAO info, and legalislation links.
    - **Absence Management**: Includes an approval workflow, BVVD reasons, detailed vacation day balance tracking, and "snipperdagen" (mandatory days off).
    - **Performance & Rewards**: Integrates Functioneringsgesprekken (performance reviews), Beoordelingsgesprekken (competency-based assessments with configurable competencies per job role), Jaarplan (yearly departmental planning with activities and sub-sections), and yearly awards.
    - **Reporting**: Provides printable reports for employee information, birthdays, anniversaries, and status.
    - **Admin Controls**: Offers comprehensive user and module permission management, department/job function CRUD, and Prikklok (time clock) CSV import with user verification.
    - **Productivity Statistics**: Includes a "Productiestatistieken" module with multiple tabs (BalieMedewerker, BalieM3, TrendOrAlgemeen, TrendOrNotaris, TrendKartografen, Landmeters) for tracking various operational metrics. Data is fetched live from the DB or falls back to seeded historical data. CSV import functionality is available for admins/managers.
    - **Monthly Production Module**: Dedicated sections for "Productie Kartografen" and "Productie Landmeters" allow detailed input of individual monthly production metrics, syncing data to historical trends and other related tables.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for interacting with the PostgreSQL database.
- **React**: Frontend library for building the user interface.
- **TypeScript**: Adds static typing to both frontend and backend code.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library for UI elements.
- **Express.js**: Backend web application framework.
- **bcrypt**: For password hashing.
- **Helmet**: Middleware for securing HTTP headers.
- **Zod**: Schema declaration and validation library, used in `shared/schema.ts`.