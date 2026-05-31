# Project Requirements

## v1 Requirements

### Authentication
- [ ] **AUTH-01**: User can log in with Super Admin, Admin, or Guard role via Supabase Auth
- [ ] **AUTH-02**: System applies Role-Based Access Control (RLS) to restrict guard access to only the scan API route

### Import & Admin
- [ ] **IMPORT-01**: Super Admin can upload an Excel (.xlsx) file with student data
- [ ] **IMPORT-02**: System parses Excel data, skipping duplicates, and inserts it into the database
- [ ] **IMPORT-03**: System validates imported data and generates an error report for skipped rows
- [ ] **ADMIN-01**: Super Admin can view a live dashboard with headcount stat cards and a real-time entry feed
- [ ] **ADMIN-02**: Super Admin can view a full, searchable/filterable student table with export functionality
- [ ] **ADMIN-03**: Super Admin can create events and manage user roles (admin/guard) per event

### QR Generation & WhatsApp
- [ ] **QR-01**: System generates a unique, cryptographically secure QR token for each imported student
- [ ] **QR-02**: System generates a branded QR card (Marketnera dominant, Vicinix tech credit) using Sharp and QRCode
- [ ] **QR-03**: System uploads the generated QR image to Supabase Storage
- [ ] **WA-01**: Super Admin can trigger a WhatsApp blast to deliver the QR card to all registered students
- [ ] **WA-02**: System delivers the QR card via Meta Cloud API using a pre-registered template
- [ ] **WA-03**: System logs WhatsApp delivery success and failures, allowing manual retries for failed sends

### Scanning & Gates
- [ ] **SCAN-01**: System provides a mobile-first, browser-based QR scanning interface for guards
- [ ] **SCAN-02**: Guard scanning a valid QR code grants entry and displays a full-screen green GRANTED state with student details
- [ ] **SCAN-03**: Guard scanning an already used QR code denies entry and displays a full-screen red DENIED state with the entry timestamp
- [ ] **SCAN-04**: System generates one Master QR token per event that tracks aggregate scans without being invalidated

## Out of Scope

- [Facial Recognition Gate] — Deferred to future premium feature
- [SMS/Email Fallback Delivery] — Future scope, initially relying only on WhatsApp API
- [Offline Guard Mode] — Future scope, currently requires live validation against Supabase to prevent fraud

## Traceability

*(To be filled by the roadmap phase)*
