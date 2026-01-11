// =====================================================
// PROJECT NAME : Dual ID Attendance System
// AUTHOR       : Adarsh Kumar Maurya
// DESCRIPTION  : RFID + Fingerprint based Attendance
// NOTE         : Sensitive UID values are masked for privacy
// =====================================================

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// ---------------- RFID CONFIG ----------------
#define RST_PIN 9
#define SS_PIN 10
MFRC522 rfid(SS_PIN, RST_PIN);

// ---------------- FINGERPRINT CONFIG ----------------
SoftwareSerial mySerial(2, 3); // TX, RX
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ---------------- LCD CONFIG ----------------
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ---------------- RTC CONFIG ----------------
RTC_DS3231 rtc;

// ---------------- LED & BUZZER ----------------
#define GREEN_LED 6
#define YELLOW_LED 5
#define RED_LED 4
#define BUZZER 7

// ---------------- MASTER CARD ----------------
// NOTE: UID masked for security (replace ** with real values)
byte masterCard[4] = {0x**, 0x**, 0x**, 0x**};

// ---------------- USER STRUCTURE ----------------
struct User {
  byte uid[4];        // RFID UID
  uint8_t fingerID;   // Fingerprint ID
  String name;        // Student Name
  int roll;           // Roll Number
};

// ---------------- REGISTERED USERS ----------------
// NOTE: All card UIDs are masked for GitHub privacy
User users[] = {
  {{0x**, 0x**, 0x**, 0x**}, 1, "Ankit", 1},
  {{0x**, 0x**, 0x**, 0x**}, 2, "Sachin", 2},
  {{0x**, 0x**, 0x**, 0x**}, 3, "Shivam", 3},
  {{0x**, 0x**, 0x**, 0x**}, 4, "Adarsh", 4},
  {{0x**, 0x**, 0x**, 0x**}, 5, "Haraprit", 5}
};

int totalUsers = sizeof(users) / sizeof(users[0]);

// ---------------- ENTRY / EXIT MEMORY ----------------
bool lastStatus[20];  // true = IN, false = OUT

// ---------------- FIND USER ----------------
int getUserIndex(byte *uid) {
  for (int i = 0; i < totalUsers; i++) {
    if (memcmp(uid, users[i].uid, 4) == 0) {
      return i;
    }
  }
  return -1;
}

// ---------------- CHECK MASTER CARD ----------------
bool isMasterCard(byte *uid) {
  return memcmp(uid, masterCard, 4) == 0;
}

// ================= SETUP =================
void setup() {

  Serial.begin(9600);

  SPI.begin();
  rfid.PCD_Init();

  finger.begin(57600);
  finger.verifyPassword();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("Dual ID System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing");

  rtc.begin();

  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  delay(2000);
  lcd.clear();
  lcd.print("System Ready");
  delay(1000);
  lcd.clear();
}

// ================= LOOP =================
void loop() {

  // Wait for RFID card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    return;

  byte *uid = rfid.uid.uidByte;

  // ================= MASTER CARD MODE =================
  if (isMasterCard(uid)) {

    lcd.clear();
    lcd.print("MASTER ACCESS");
    lcd.setCursor(0, 1);
    lcd.print("Scan Finger");

    digitalWrite(YELLOW_LED, HIGH);

    while (finger.getImage() != FINGERPRINT_OK);
    finger.image2Tz();
    int result = finger.fingerFastSearch();

    digitalWrite(YELLOW_LED, LOW);

    if (result == FINGERPRINT_OK) {

      int fingerID = finger.fingerID;
      int userIndex = -1;

      for (int i = 0; i < totalUsers; i++) {
        if (users[i].fingerID == fingerID) {
          userIndex = i;
          break;
        }
      }

      if (userIndex != -1) {

        bool nowIN = !lastStatus[userIndex];
        lastStatus[userIndex] = nowIN;

        String status = nowIN ? "ENTRY" : "EXIT";
        DateTime now = rtc.now();

        char timeStamp[25];
        sprintf(timeStamp, "%04d-%02d-%02d %02d:%02d:%02d",
                now.year(), now.month(), now.day(),
                now.hour(), now.minute(), now.second());

        lcd.clear();
        lcd.print("MASTER ");
        lcd.print(status);
        lcd.setCursor(0, 1);
        lcd.print(users[userIndex].name);

        digitalWrite(GREEN_LED, HIGH);
        tone(BUZZER, 700, 200);

        Serial.print("MASTER,");
        Serial.print(users[userIndex].roll);
        Serial.print(",");
        Serial.print(status);
        Serial.print(",");
        Serial.println(timeStamp);

        delay(2000);
        digitalWrite(GREEN_LED, LOW);
      }
    }
    return;
  }

  // ================= NORMAL USER MODE =================
  int userIndex = getUserIndex(uid);

  if (userIndex == -1) {
    lcd.clear();
    lcd.print("Invalid Card");
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 1200, 300);
    delay(1500);
    digitalWrite(RED_LED, LOW);
    return;
  }

  lcd.clear();
  lcd.print(users[userIndex].name);
  lcd.setCursor(0, 1);
  lcd.print("Place Finger");

  digitalWrite(YELLOW_LED, HIGH);

  while (finger.getImage() != FINGERPRINT_OK);
  finger.image2Tz();
  int result = finger.fingerFastSearch();

  digitalWrite(YELLOW_LED, LOW);

  if (result == FINGERPRINT_OK && finger.fingerID == users[userIndex].fingerID) {

    bool nowIN = !lastStatus[userIndex];
    lastStatus[userIndex] = nowIN;

    String status = nowIN ? "ENTRY" : "EXIT";
    DateTime now = rtc.now();

    char timeStamp[25];
    sprintf(timeStamp, "%04d-%02d-%02d %02d:%02d:%02d",
            now.year(), now.month(), now.day(),
            now.hour(), now.minute(), now.second());

    lcd.clear();
    lcd.print(status);
    lcd.setCursor(0, 1);
    lcd.print(timeStamp);

    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER, 700, 200);

    Serial.print(users[userIndex].name);
    Serial.print(",");
    Serial.print(users[userIndex].roll);
    Serial.print(",");
    Serial.print(status);
    Serial.print(",");
    Serial.println(timeStamp);

    delay(2000);
    digitalWrite(GREEN_LED, LOW);

  } else {
    lcd.clear();
    lcd.print("Wrong Finger");
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 1500, 400);
    delay(1500);
    digitalWrite(RED_LED, LOW);
  }
}
