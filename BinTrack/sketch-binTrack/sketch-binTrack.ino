#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

#define WIFI_SSID "Sanjiv"
#define WIFI_PASSWORD "123123123"

#define FIREBASE_HOST "brave-design-417105-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyCzi2IsDsZE5WIA7KpDgS-0RFs6vxSDqDY"

#define TRIG_PIN D7
#define ECHO_PIN D6  

FirebaseData firebaseData;

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  connectToWiFi();

  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Disconnected! Reconnecting...");
    connectToWiFi();
  }

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
    Serial.println("Firebase update OK");
  } else {
    Serial.println("Firebase update FAILED: " + firebaseData.errorReason());
  }

  delay(5000);
}
