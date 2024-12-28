import serial
import time
from playsound import playsound

ser = serial.Serial('COM7', 9600) 
time.sleep(2)

def alert_sound():
    playsound(r"ShushBot\alert.mp3")  
    print("Sound played successfully!")
    
while True:
    if ser.in_waiting > 0:
        noise_level = int(ser.readline().decode('utf-8').strip())  
        
        print(f"Noise Level: {noise_level}")
        if noise_level > 870:
            print("Noise level too high!")
            alert_sound()

    time.sleep(1) 
