#include <SoftwareSerial.h>

#define TRIG_PIN 9  
#define ECHO_PIN 10  

SoftwareSerial gsmSerial(0, 1);  

void setup() {
  Serial.begin(9600);
  gsmSerial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  delay(1000);
}

int filledCount = 0;
int errorCount = 0;
bool messageSent = false;  

void loop() {
  long duration, distance;

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);
  distance = duration * 0.034 / 2;

  if (distance > 0 && distance < 790) {
    if (distance < 15) {  
      filledCount++;
      errorCount = 0;  
    } else {
      filledCount = 0;  
    }
  } else {
    errorCount++;
    filledCount = 0;  
  }

  check();

  delay(1000);  
}

void check() {
  if (filledCount >= 3 && !messageSent) {  
    Serial.println(" -> Dustbin is almost filled ");
    sendMessage("+919361515057", "dustbin is filled");
    messageSent = true;  
  }

  if (errorCount >= 3) {  
    Serial.println(" -> Error or Dustbin is in overflow ");
    if (!messageSent) {
      sendMessage("+919843620510", "Error: Dustbin is in overflow");
      messageSent = true; 
    }
  }
}

void sendMessage(String phoneNumber, String message) {
  gsmSerial.println("AT+CMGF=1");  
  delay(1000);
  
  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(phoneNumber);
  gsmSerial.println("\"");
  delay(1000);
  
  gsmSerial.println(message);
  delay(100);

  gsmSerial.write(26);
  delay(100);
  
  Serial.println("SMS sent successfully ");
}