# Dual ID Attendance System

A secure Arduino-based attendance system using **RFID Card + Fingerprint Sensor**.

---

## 📌 Description

Dual ID Attendance System uses **two-factor authentication** to mark attendance:
- RFID Card verification
- Fingerprint verification

Attendance is recorded only when **both IDs match**, preventing proxy attendance.
A **MASTER RFID card** is also implemented for administrative access.

All attendance records include **ENTRY / EXIT status with date and time** using an RTC module.

Sensitive card data is intentionally masked in the source code for security.

---

## ⚙️ Features

- RFID + Fingerprint authentication
- MASTER card support
- Automatic ENTRY / EXIT toggle
- Real-time clock logging
- LCD display status
- LED & buzzer indication
- Excel-compatible serial output
- Secure & reliable system

---

## 🧠 Working Flow

1. Scan RFID card
2. Place fingerprint
3. If both match:
   - ENTRY or EXIT is marked
4. Date & time displayed on LCD
5. Attendance sent to Serial Monitor

MASTER card allows attendance using **any registered fingerprint**.

---

## 🖥 Serial Output Format

Name,Roll,Status,Date Time


Example:
Adarsh,4,ENTRY,2026-01-11 10:15:45
MASTER,2,EXIT,2026-01-11 16:30:12


---

## 🔌 Hardware Used

- Arduino Uno
- MFRC522 RFID Module
- Fingerprint Sensor (R305/R307)
- DS3231 RTC Module
- 16x2 LCD (I2C)
- LEDs & Buzzer

---

## 📚 Libraries Required

- MFRC522
- RTClib
- LiquidCrystal_I2C
- Adafruit Fingerprint Sensor Library
- SoftwareSerial
- SPI
- Wire

---

## 🔒 Security Note

RFID UIDs and MASTER card numbers are masked in the code.
Replace masked values with real UIDs before hardware deployment.

---

## 👨‍💻 Author

**Adarsh Kumar Maurya**  
B.Tech – Computer Science & Engineering

---

## 🔌 Hardware Used

- Arduino Uno
- MFRC522 RFID Module
- Fingerprint Sensor (R305/R307)
- DS3231 RTC Module
- 16x2 LCD (I2C)
- LEDs & Buzzer

- ---

## 📚 Libraries Required

- MFRC522
- RTClib
- LiquidCrystal_I2C
- Adafruit Fingerprint Sensor Library
- SoftwareSerial
- SPI
- Wire

---

## 🔒 Security Note

RFID UIDs and MASTER card numbers are masked in the code.
Replace masked values with real UIDs before hardware deployment.

---

## 👨‍💻 Author

**Adarsh Kumar Maurya**  
B.Tech – Computer Science & Engineering

---

## 📜 License

Educational use only.
