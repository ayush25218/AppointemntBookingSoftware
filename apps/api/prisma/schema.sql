CREATE DATABASE IF NOT EXISTS hospital_appointment_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hospital_appointment_system;

CREATE TABLE roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code ENUM('SUPER_ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTION') NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
  date_of_birth DATE NULL,
  avatar_url VARCHAR(255) NULL,
  address_line_1 VARCHAR(255) NULL,
  address_line_2 VARCHAR(255) NULL,
  city VARCHAR(80) NULL,
  state VARCHAR(80) NULL,
  country VARCHAR(80) NULL DEFAULT 'India',
  postal_code VARCHAR(20) NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role_status (role_id, status),
  KEY idx_users_created_at (created_at),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE doctor_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  registration_number VARCHAR(64) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  qualification VARCHAR(255) NULL,
  years_of_experience SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10, 2) NOT NULL,
  slot_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  working_hours_json JSON NOT NULL,
  bio TEXT NULL,
  clinic_address_line_1 VARCHAR(255) NULL,
  clinic_address_line_2 VARCHAR(255) NULL,
  clinic_city VARCHAR(80) NULL,
  clinic_state VARCHAR(80) NULL,
  clinic_country VARCHAR(80) NULL DEFAULT 'India',
  clinic_postal_code VARCHAR(20) NULL,
  average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
  is_accepting_new_patients BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctor_profiles_user_id (user_id),
  UNIQUE KEY uq_doctor_profiles_registration (registration_number),
  KEY idx_doctor_profiles_specialty_accepting (specialty, is_accepting_new_patients),
  KEY idx_doctor_profiles_fee (consultation_fee),
  CONSTRAINT fk_doctor_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_user_id BIGINT UNSIGNED NOT NULL,
  doctor_profile_id BIGINT UNSIGNED NOT NULL,
  booked_by_user_id BIGINT UNSIGNED NULL,
  appointment_date DATE NOT NULL,
  appointment_start_at DATETIME(3) NOT NULL,
  appointment_end_at DATETIME(3) NOT NULL,
  patient_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  status ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  reason_for_visit VARCHAR(255) NOT NULL,
  symptoms_json JSON NULL,
  notes TEXT NULL,
  cancel_reason VARCHAR(255) NULL,
  slot_lock TINYINT GENERATED ALWAYS AS (
    CASE
      WHEN status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED') THEN 1
      ELSE NULL
    END
  ) STORED,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointments_active_slot (doctor_profile_id, appointment_start_at, slot_lock),
  KEY idx_appointments_doctor_status_start (doctor_profile_id, status, appointment_start_at),
  KEY idx_appointments_patient_status_start (patient_user_id, status, appointment_start_at),
  KEY idx_appointments_date (appointment_date),
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_doctor_profile
    FOREIGN KEY (doctor_profile_id) REFERENCES doctor_profiles(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_booked_by
    FOREIGN KEY (booked_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id BIGINT UNSIGNED NOT NULL,
  patient_user_id BIGINT UNSIGNED NOT NULL,
  gateway_transaction_id VARCHAR(120) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'INITIATED',
  payment_method ENUM('CASH', 'CARD', 'UPI', 'NET_BANKING', 'WALLET') NOT NULL,
  provider VARCHAR(64) NULL,
  metadata_json JSON NULL,
  paid_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_gateway_id (gateway_transaction_id),
  KEY idx_transactions_appointment_status_created (appointment_id, status, created_at),
  KEY idx_transactions_patient_created (patient_user_id, created_at),
  CONSTRAINT fk_transactions_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_patient
    FOREIGN KEY (patient_user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id BIGINT UNSIGNED NOT NULL,
  patient_user_id BIGINT UNSIGNED NOT NULL,
  doctor_profile_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(120) NULL,
  comment TEXT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_appointment_id (appointment_id),
  KEY idx_reviews_doctor_approved_created (doctor_profile_id, is_approved, created_at),
  KEY idx_reviews_patient_created (patient_user_id, created_at),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_patient
    FOREIGN KEY (patient_user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_doctor_profile
    FOREIGN KEY (doctor_profile_id) REFERENCES doctor_profiles(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO roles (code, display_name, description) VALUES
  ('SUPER_ADMIN', 'Super Admin', 'System level administrator with full access'),
  ('DOCTOR', 'Doctor', 'Medical practitioner managing appointments and reviews'),
  ('PATIENT', 'Patient', 'Patient booking consultations and managing appointments'),
  ('RECEPTION', 'Reception', 'Reception staff handling walk-ins and schedule coordination');
