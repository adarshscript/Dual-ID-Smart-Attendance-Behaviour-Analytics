#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// ----- RFID -----
#define RST_PIN 9
#define SS_PIN 10
MFRC522 rfid(SS_PIN, RST_PIN);

// ----- Finger -----
SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ----- LCD -----
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ----- RTC -----
RTC_DS3231 rtc;

// ----- LED + BUZZER -----
#define GREEN_LED 6
#define YELLOW_LED 5
#define RED_LED 4
#define BUZZER 7

// ----- MASTER CARD (CAN ACCEPT ANY FINGER) -----
byte masterCard[4] = {0x13, 0xB4, 0xEA, 0x2C};

// ----- USERS -----
struct User {
  byte uid[4];
  uint8_t fingerID;
  String name;
  int roll;
};

User users[] = {
  {{0xA3, 0x5F, 0x21, 0x21}, 1, "Ankit", 1},
  {{0x13, 0x17, 0xA0, 0x20}, 2, "Sachin", 2},
  {{0xB3, 0xD9, 0xB9, 0x20}, 3, "Shivam", 3},
  {{0x73, 0x74, 0x9E, 0x20}, 5, "Haraprit", 5},
  {{0xA6, 0xFF, 0xFA, 0x03}, 4, "Adarsh", 4}
};

int totalUsers = sizeof(users) / sizeof(users[0]);

// ENTRY/EXIT MEMORY
bool lastStatus[20];

int getUserIndex(byte *uid) {
  for (int i = 0; i < totalUsers; i++) {
    if (memcmp(uid, users[i].uid, 4) == 0) {
      return i;
    }
  }
  return -1;
}

bool isMasterCard(byte *uid) {
  return memcmp(uid, masterCard, 4) == 0;
}

void setup() {
  Serial.begin(9600);

  SPI.begin();
  rfid.PCD_Init();

  finger.begin(57600);
  finger.verifyPassword();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("SYSTEM READY");

  rtc.begin();

  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  delay(1500);
  lcd.clear();
}

void loop() {

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    return;

  byte *uid = rfid.uid.uidByte;

  // ---------------------------
  // CASE 1: MASTER CARD
  // ---------------------------
  if (isMasterCard(uid)) {

    lcd.clear();
    lcd.print("MASTER CARD");
    lcd.setCursor(0, 1);
    lcd.print("Put ANY Finger");

    digitalWrite(YELLOW_LED, HIGH);

    while (finger.getImage() != FINGERPRINT_OK);

    finger.image2Tz();
    int result = finger.fingerFastSearch();

    digitalWrite(YELLOW_LED, LOW);

    if (result == FINGERPRINT_OK) {

      int fingerID = finger.fingerID;

      // Find which user has this finger
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
        char timestamp[30];
        sprintf(timestamp, "%04d-%02d-%02d %02d:%02d:%02d",
                now.year(), now.month(), now.day(),
                now.hour(), now.minute(), now.second());

        digitalWrite(GREEN_LED, HIGH);
        tone(BUZZER, 700, 200);

        // LCD
        lcd.clear();
        lcd.print("MASTER: ");
        lcd.print(status);
        lcd.setCursor(0, 1);
        lcd.print(timestamp);

        // Excel: Name=MASTER, Roll=finger user roll
        Serial.print("MASTER"); Serial.print(",");
        Serial.print(users[userIndex].roll); Serial.print(",");
        Serial.print(status); Serial.print(",");
        Serial.println(timestamp);

        delay(1800);
        digitalWrite(GREEN_LED, LOW);
      }
    }

    return;
  }

  // ---------------------------
  // CASE 2: NORMAL CARD
  // ---------------------------

  int userIndex = getUserIndex(uid);

  if (userIndex == -1) {
    lcd.clear();
    lcd.print("Card Not Found");
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 1200, 300);
    delay(1500);
    digitalWrite(RED_LED, LOW);
    return;
  }

  lcd.clear();
  lcd.print(users[userIndex].name);
  lcd.setCursor(0, 1);
  lcd.print("Put Finger...");

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
    char timestamp[30];
    sprintf(timestamp, "%04d-%02d-%02d %02d:%02d:%02d",
            now.year(), now.month(), now.day(),
            now.hour(), now.minute(), now.second());

    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER, 700, 200);

    lcd.clear();
    lcd.print(status);
    lcd.setCursor(0, 1);
    lcd.print(timestamp);

    Serial.print(users[userIndex].name); Serial.print(",");
    Serial.print(users[userIndex].roll); Serial.print(",");
    Serial.print(status); Serial.print(",");
    Serial.println(timestamp);

    delay(1800);
    digitalWrite(GREEN_LED, LOW);

  } else {
    lcd.clear();
    lcd.print("Wrong Finger!");

    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 1500, 400);

    delay(1500);
    digitalWrite(RED_LED, LOW);
  }

  delay(500);
}
