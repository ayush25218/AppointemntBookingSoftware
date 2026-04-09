# Hospital Appointment Platform ER Diagram

This ER diagram reflects the current MySQL/Prisma schema used by the hospital appointment booking platform.

```mermaid
erDiagram
  ROLES {
    bigint id PK
    enum code UK
    varchar display_name
    varchar description
    datetime created_at
    datetime updated_at
  }

  USERS {
    bigint id PK
    bigint role_id FK
    varchar full_name
    varchar email UK
    varchar phone UK
    varchar password_hash
    enum gender
    date date_of_birth
    varchar avatar_url
    varchar address_line_1
    varchar address_line_2
    varchar city
    varchar state
    varchar country
    varchar postal_code
    enum status
    datetime last_login_at
    datetime created_at
    datetime updated_at
  }

  DOCTOR_PROFILES {
    bigint id PK
    bigint user_id FK,UK
    varchar registration_number UK
    varchar specialty
    varchar qualification
    int years_of_experience
    decimal consultation_fee
    int slot_duration_minutes
    varchar timezone
    json working_hours_json
    text bio
    varchar clinic_address_line_1
    varchar clinic_address_line_2
    varchar clinic_city
    varchar clinic_state
    varchar clinic_country
    varchar clinic_postal_code
    decimal average_rating
    int total_reviews
    boolean is_accepting_new_patients
    datetime created_at
    datetime updated_at
  }

  APPOINTMENTS {
    bigint id PK
    bigint patient_user_id FK
    bigint doctor_profile_id FK
    bigint booked_by_user_id FK
    date appointment_date
    datetime appointment_start_at
    datetime appointment_end_at
    varchar patient_timezone
    enum status
    enum payment_status
    varchar reason_for_visit
    json symptoms_json
    text notes
    varchar cancel_reason
    tinyint slot_lock
    datetime created_at
    datetime updated_at
  }

  TRANSACTIONS {
    bigint id PK
    bigint appointment_id FK
    bigint patient_user_id FK
    varchar gateway_transaction_id UK
    decimal amount
    char currency
    enum status
    enum payment_method
    varchar provider
    json metadata_json
    datetime paid_at
    datetime created_at
    datetime updated_at
  }

  REVIEWS {
    bigint id PK
    bigint appointment_id FK,UK
    bigint patient_user_id FK
    bigint doctor_profile_id FK
    int rating
    varchar title
    text comment
    boolean is_approved
    datetime created_at
    datetime updated_at
  }

  ROLES ||--o{ USERS : "assigned to"
  USERS ||--o| DOCTOR_PROFILES : "has doctor profile"
  USERS ||--o{ APPOINTMENTS : "books as patient"
  USERS ||--o{ APPOINTMENTS : "creates booking"
  DOCTOR_PROFILES ||--o{ APPOINTMENTS : "receives"
  APPOINTMENTS ||--o{ TRANSACTIONS : "has payments"
  USERS ||--o{ TRANSACTIONS : "pays"
  APPOINTMENTS ||--o| REVIEWS : "can receive one review"
  USERS ||--o{ REVIEWS : "writes"
  DOCTOR_PROFILES ||--o{ REVIEWS : "gets reviewed"
```

## Key Relationship Notes

- `roles -> users` is `1:N`
- `users -> doctor_profiles` is `1:0..1`
- `users (patient) -> appointments` is `1:N`
- `users (staff/reception/admin) -> appointments.booked_by_user_id` is `1:N`, optional
- `doctor_profiles -> appointments` is `1:N`
- `appointments -> transactions` is `1:N`
- `appointments -> reviews` is `1:0..1`
- `doctor_profiles -> reviews` is `1:N`

## Important Constraints

- `users.email` and `users.phone` are unique
- `doctor_profiles.user_id` is unique, so one user can own only one doctor profile
- `doctor_profiles.registration_number` is unique
- `reviews.appointment_id` is unique, so one appointment can have at most one review
- `appointments` uses the unique key `doctor_profile_id + appointment_start_at + slot_lock`
  to block double-booking for active slots

## Performance Indexes

- `users(role_id, status)`
- `doctor_profiles(specialty, is_accepting_new_patients)`
- `doctor_profiles(consultation_fee)`
- `appointments(doctor_profile_id, status, appointment_start_at)`
- `appointments(patient_user_id, status, appointment_start_at)`
- `appointments(appointment_date)`
- `transactions(appointment_id, status, created_at)`
- `transactions(patient_user_id, created_at)`
- `reviews(doctor_profile_id, is_approved, created_at)`
- `reviews(patient_user_id, created_at)`
