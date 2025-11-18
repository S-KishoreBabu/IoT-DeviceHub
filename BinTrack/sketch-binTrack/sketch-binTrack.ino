#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

#define WIFI_SSID "POCO F5"
#define WIFI_PASSWORD "123456789"

// Firebase config
#define FIREBASE_HOST "brave-design-417105-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyCzi2IsDsZE5WIA7KpDgS-0RFs6vxSDqDY"

#define TRIG_PIN D7
#define ECHO_PIN D6  

FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = (duration * 0.034) / 2;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  bool isFilled = distance <= 15;
  if (Firebase.setBool(firebaseData, "/dustbins/001/filled", isFilled)) {
    Serial.println("Updated to Firebase: " + String(isFilled));
  } else {
    Serial.println("Firebase update failed: " + firebaseData.errorReason());
  }

  delay(5000);
}
