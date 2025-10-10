# IoT Hardware Integration Guide

## Overview

This guide explains how to integrate IoT air quality sensors with the Bengaluru Air Quality Monitoring system. The system supports real-time data streaming from multiple sensor types via WebSocket connections.

---

## Supported IoT Sensors

### 1. MQ-135 Air Quality Sensor

**Description:** General-purpose air quality sensor that detects gases like NH3, NOx, alcohol, benzene, smoke, and CO2.

**Specifications:**
- Operating Voltage: 5V DC
- Heater Voltage: 5V ± 0.1V
- Load Resistance: 20 kΩ
- Heating Resistance: 33 Ω ± 5%
- Preheat Time: 24-48 hours (for stable readings)
- Detection Range: 10-1000 ppm
- Interface: Analog output

**Wiring (Arduino/ESP32):**
```
MQ-135 Pin     →  Microcontroller Pin
VCC            →  5V
GND            →  GND
A0 (Analog)    →  A0 (Analog Input)
D0 (Digital)   →  D2 (Digital Input - Optional)
```

**Arduino Code Example:**
```cpp
#define MQ135_PIN A0
#define RL 20.0          // Load resistance in kΩ
#define R0 10.0          // Clean air resistance in kΩ

float getMQ135PPM() {
  int sensorValue = analogRead(MQ135_PIN);
  float voltage = sensorValue * (5.0 / 1023.0);
  float RS = ((5.0 * RL) / voltage) - RL;
  float ratio = RS / R0;
  float ppm = 116.6020682 * pow(ratio, -2.769034857);
  return ppm;
}
```

### 2. DHT11 / DHT22 Temperature & Humidity Sensor

**DHT11 Specifications:**
- Temperature Range: 0-50°C (±2°C accuracy)
- Humidity Range: 20-80% RH (±5% accuracy)
- Sampling Rate: 1 Hz (1 reading per second)
- Operating Voltage: 3.3-5.5V DC
- Interface: Digital signal via single-wire serial

**DHT22 Specifications (Recommended):**
- Temperature Range: -40 to 80°C (±0.5°C accuracy)
- Humidity Range: 0-100% RH (±2-5% accuracy)
- Sampling Rate: 0.5 Hz (1 reading per 2 seconds)
- Operating Voltage: 3.3-6V DC
- Interface: Digital signal via single-wire serial

**Wiring:**
```
DHT Pin        →  Microcontroller Pin
VCC (+)        →  3.3V or 5V
DATA           →  D4 (Digital Pin)
GND (-)        →  GND

Note: Use a 10kΩ pull-up resistor between VCC and DATA pin
```

**Arduino Code Example (Using DHT Library):**
```cpp
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22   // Change to DHT11 if using DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C  Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  delay(2000);
}
```

### 3. BME280 Barometric Pressure, Temperature & Humidity Sensor

**Specifications:**
- Temperature Range: -40 to 85°C (±1°C accuracy)
- Humidity Range: 0-100% RH (±3% accuracy)
- Pressure Range: 300-1100 hPa (±1 hPa accuracy)
- Operating Voltage: 1.71-3.6V DC (3.3V typical)
- Interface: I2C or SPI
- I2C Address: 0x76 or 0x77 (default)

**Wiring (I2C Mode):**
```
BME280 Pin     →  Microcontroller Pin
VCC            →  3.3V
GND            →  GND
SCL            →  SCL (I2C Clock - Pin 22 on ESP32)
SDA            →  SDA (I2C Data - Pin 21 on ESP32)
CSB            →  3.3V (for I2C mode)
SDO            →  GND (for I2C address 0x76) or 3.3V (for 0x77)
```

**Arduino Code Example (Using Adafruit BME280 Library):**
```cpp
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define SEALEVELPRESSURE_HPA (1013.25)

Adafruit_BME280 bme;

void setup() {
  Serial.begin(115200);

  if (!bme.begin(0x76)) {
    Serial.println("Could not find BME280 sensor!");
    while (1);
  }
}

void loop() {
  float temperature = bme.readTemperature();
  float pressure = bme.readPressure() / 100.0F;
  float humidity = bme.readHumidity();
  float altitude = bme.readAltitude(SEALEVELPRESSURE_HPA);

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println("°C");

  Serial.print("Pressure: ");
  Serial.print(pressure);
  Serial.println(" hPa");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  Serial.print("Altitude: ");
  Serial.print(altitude);
  Serial.println("m");

  delay(2000);
}
```

---

## Complete IoT Integration System

### Hardware Requirements

**Recommended Configuration:**
- **Microcontroller:** ESP32 or ESP8266 (for WiFi connectivity)
- **Sensors:**
  - 1x MQ-135 Air Quality Sensor
  - 1x DHT22 Temperature & Humidity Sensor (or BME280)
  - 1x BME280 Barometric Pressure Sensor (optional, if not using DHT22)
- **Power Supply:** 5V DC adapter or USB power bank
- **Miscellaneous:**
  - Breadboard
  - Jumper wires
  - 10kΩ resistors (2x for pull-ups)
  - Enclosure/case for weatherproofing (if outdoor deployment)

### Complete Circuit Diagram

```
ESP32 Pinout:
┌─────────────────────────────────┐
│                                 │
│  GPIO 32 (ADC1_CH4) ← MQ-135 A0 │
│  GPIO 4           ← DHT22 DATA  │
│  GPIO 21 (SDA)    ← BME280 SDA  │
│  GPIO 22 (SCL)    ← BME280 SCL  │
│  3.3V             → Sensors VCC │
│  GND              → Sensors GND │
│                                 │
└─────────────────────────────────┘
```

### ESP32 Complete Code (WebSocket Client)

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket Server Configuration
const char* ws_host = "your-server-ip";  // Replace with your server IP/domain
const int ws_port = 5000;
const char* ws_path = "/ws";

// Device Configuration
const char* deviceId = "iot-bengaluru-001";
const char* location = "Bengaluru Central";

// Sensor Pins
#define MQ135_PIN 32
#define DHTPIN 4
#define DHTTYPE DHT22

// Sensor Objects
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BME280 bme;
WebSocketsClient webSocket;

// Sensor data
float temperature = 0;
float humidity = 0;
float pressure = 0;
float pm25 = 0;
float pm10 = 0;
int batteryLevel = 100;
int signalStrength = 0;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 30000; // Send data every 30 seconds

void setup() {
  Serial.begin(115200);

  // Initialize sensors
  dht.begin();

  if (!bme.begin(0x76)) {
    Serial.println("Could not find BME280 sensor!");
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Setup WebSocket
  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  unsigned long currentTime = millis();

  if (currentTime - lastSendTime >= sendInterval) {
    readSensors();
    sendSensorData();
    lastSendTime = currentTime;
  }
}

void readSensors() {
  // Read DHT22
  humidity = dht.readHumidity();
  float dhtTemp = dht.readTemperature();

  if (!isnan(dhtTemp)) {
    temperature = dhtTemp;
  }

  // Read BME280
  if (bme.begin(0x76)) {
    temperature = bme.readTemperature();
    pressure = bme.readPressure() / 100.0F;
    humidity = bme.readHumidity();
  }

  // Read MQ-135
  int mq135Value = analogRead(MQ135_PIN);
  float voltage = mq135Value * (3.3 / 4095.0);

  // Convert MQ-135 reading to estimated PM values
  pm25 = map(mq135Value, 0, 4095, 0, 500) / 10.0;
  pm10 = pm25 * 1.5;

  // Get WiFi signal strength
  signalStrength = constrain(map(WiFi.RSSI(), -100, -50, 0, 100), 0, 100);

  // Simulate battery level (replace with actual battery monitoring)
  batteryLevel = random(80, 100);

  Serial.println("Sensor readings:");
  Serial.printf("Temperature: %.2f°C\n", temperature);
  Serial.printf("Humidity: %.2f%%\n", humidity);
  Serial.printf("Pressure: %.2f hPa\n", pressure);
  Serial.printf("PM2.5: %.2f µg/m³\n", pm25);
  Serial.printf("PM10: %.2f µg/m³\n", pm10);
  Serial.printf("Signal: %d%%\n", signalStrength);
}

void sendSensorData() {
  // Create JSON document
  StaticJsonDocument<512> doc;

  doc["type"] = "iot_reading";
  doc["deviceId"] = deviceId;
  doc["location"] = location;
  doc["pm25"] = pm25;
  doc["pm10"] = pm10;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["batteryLevel"] = batteryLevel;
  doc["signalStrength"] = signalStrength;
  doc["timestamp"] = millis();

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("Data sent to server:");
  Serial.println(jsonString);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected");
      break;

    case WStype_CONNECTED:
      Serial.println("WebSocket connected!");
      Serial.printf("Connected to: %s\n", payload);
      break;

    case WStype_TEXT:
      Serial.printf("Received: %s\n", payload);

      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        const char* type = doc["type"];

        if (strcmp(type, "connection") == 0) {
          Serial.println("Connection confirmed by server");
        } else if (strcmp(type, "subscription_confirmed") == 0) {
          Serial.println("Subscription confirmed");
        }
      }
      break;

    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}
```

### Required Arduino Libraries

Install these libraries via Arduino Library Manager:
```
1. WiFi (ESP32 built-in)
2. WebSocketsClient by Markus Sattler
3. ArduinoJson by Benoit Blanchon
4. DHT sensor library by Adafruit
5. Adafruit BME280 Library
6. Adafruit Unified Sensor
```

---

## Data Format

### WebSocket Message Format (IoT Device → Server)

```json
{
  "type": "iot_reading",
  "deviceId": "iot-bengaluru-001",
  "location": "Bengaluru Central",
  "pm25": 35.5,
  "pm10": 68.2,
  "temperature": 28.5,
  "humidity": 65.0,
  "pressure": 1013.25,
  "batteryLevel": 85,
  "signalStrength": 78,
  "timestamp": "2025-10-10T10:30:00Z"
}
```

### Server Response Format

```json
{
  "type": "subscription_confirmed",
  "subscription": "iot_readings",
  "timestamp": "2025-10-10T10:30:05Z"
}
```

---

## Deployment Checklist

- [ ] Hardware assembly completed and tested
- [ ] All sensors calibrated and providing accurate readings
- [ ] WiFi credentials configured
- [ ] WebSocket server URL/IP configured
- [ ] Unique device ID assigned
- [ ] Power supply connected and stable
- [ ] Device enclosed in weatherproof case (if outdoor)
- [ ] Mounted at appropriate height (1.5-2m above ground)
- [ ] Initial connection test successful
- [ ] Data appearing in dashboard

---

## Troubleshooting

### Sensor Issues

**MQ-135 showing erratic readings:**
- Ensure 24-48 hour preheat time has passed
- Check power supply is stable 5V
- Verify wiring connections
- Sensor may need calibration in clean air

**DHT22 returning NaN:**
- Check wiring and pull-up resistor (10kΩ)
- Increase delay between readings (minimum 2 seconds)
- Verify sensor is not damaged
- Try different GPIO pin

**BME280 not detected:**
- Check I2C wiring (SDA, SCL)
- Verify I2C address (0x76 or 0x77) using I2C scanner
- Check power supply voltage (3.3V)
- Ensure CSB pin is pulled high for I2C mode

### Connectivity Issues

**WiFi not connecting:**
- Verify SSID and password are correct
- Check WiFi signal strength at device location
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Try moving device closer to router

**WebSocket connection fails:**
- Verify server IP/domain and port
- Check firewall settings on server
- Ensure WebSocket path is correct (/ws)
- Check server logs for errors

---

## Next Steps

1. **Multiple Device Deployment:** Deploy multiple IoT devices across different locations in Bengaluru
2. **Data Visualization:** View real-time IoT data on the dashboard's IoT Device Monitor section
3. **Alerts & Notifications:** Configure alerts based on IoT sensor thresholds
4. **Historical Analysis:** Use collected data for trend analysis and predictions

---

## Support

For technical support and questions:
- Check the main README.md for project documentation
- Review server logs for WebSocket connection status
- Enable serial monitor debugging on ESP32 (115200 baud rate)
- Check the IoT Device Monitor in the dashboard

---

**Last Updated:** October 2025
**Compatible with:** ESP32, ESP8266, Arduino with WiFi Shield
