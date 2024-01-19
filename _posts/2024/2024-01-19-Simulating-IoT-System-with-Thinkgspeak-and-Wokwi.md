---
layout: post
description: Simulating IoT System with Thinkgspeak and Wokwi
date: 2024-01-19
---
<h1> Simulating IoT System with Thinkgspeak and Wokwi </h1>

* TOC
{:toc}

Recently, I've started to learn about IoT, which is outstanding. I really enjoy working with small devices, connecting sensors, soldering, and measuring clocks. And gather everything in a device that does great things with a tiny amount of power and not a very performant network connection.

So, that's cool, but what if we don't have devices, or can't solder? Personally, I'd like not to waste my Arduino or Raspberry Pico doing something wrong. And anyway, it's good planning first. And there is a way! You will need the [ThingSpeak platform](https://thingspeak.com/) from MathWorks, [Wokwi](https://wokwi.com/), and Imagination. Let's start.

## IoT Project

Thinking a bit, I decided to create a Smart Recreation Site.
To bring my simulated project to reality, I've downloaded a cool map of [Seaport Village](https://www.seaportvillage.com/) (I hope they don't mind) and placed some Smart things here and there.

<img id="myImg" alt="Smart Village" src="/assets/blog/2024/01-IoT-SmartVillage.png" border=1 width="100%"/>

### Devices and Their Metrics

| Device Name   | Metrics                               | Description                   |
|---------------|---------------------------------------|------------------------------ |
| Control Tower | Temperature, Humidity, Weaher Quality | Logical centre of the village |
| Smart Suite   | Temperature, Humidity, Rooms          | Recreation point              |
| Village Gate  | Temperature, Humidity, Lights, Servo  | Access-control point          |

## Thnkgspeak Channels

Let's create a couple of channels in Thingspeak. I will need three channels for smart devices and one for analytics, but I won't cover analytics on a decent level here.

<img id="myImg" alt="Smart Village" src="/assets/blog/2024/01-IoT-ThingspeakChannels.png" width="100%"/>

Then, let's define devices and metrics.

## Control Tower

* [Control Tower on Wokwi](https://wokwi.com/projects/387266278511027201)
* [Village Gate on Thinkgspeak](https://thingspeak.com/channels/2405835)

The Control Tower has basic sensors, generic for a whole site. The sensor implementation is based on the ESP32 platform with DHT22 (Digital Temperature and Humidity Sensor) and LED for indication of dangerous weather.

### Control Tower Diagram

<img id="myImg" alt="Control Tower Channel" src="/assets/blog/2024/01-IoT-Control-Tower-Sensor.png" width="50%"/>

### Control Tower Arduino Sketch

```arduino
#include <WiFi.h>
#include "DHTesp.h"
#include "ThingSpeak.h"

const int DHT_PIN = 15;
const int LED_PIN = 13;
const char *WIFI_NAME = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";
const int myChannelNumber = 2405835;
const char *myApiKey = "26R51XI1UJXRM4IF";
const char *server = "api.thingspeak.com";

DHTesp dhtSensor;
WiFiClient client;

void setup() {
  Serial.begin(115200);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Wifi not connected");
  }
  Serial.println("Wifi connected !");
  Serial.println("Local IP: " + String(WiFi.localIP()));
  WiFi.mode(WIFI_STA);
  ThingSpeak.begin(client);
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  ThingSpeak.setField(1, data.temperature);
  ThingSpeak.setField(2, data.humidity);
  if (data.temperature > 40 || data.temperature < 0 || data.humidity > 80 || data.humidity < 10) {
    ThingSpeak.setField(3, 1);
    digitalWrite(LED_PIN, HIGH);
  } else {
    ThingSpeak.setField(3, 0);
    digitalWrite(LED_PIN, LOW);
  }

  int x = ThingSpeak.writeFields(myChannelNumber, myApiKey);

  Serial.println("Temperature: " + String(data.temperature, 2) + "°C");
  Serial.println("Humidity: " + String(data.humidity, 1) + "%");

  if (x == 200) {
    Serial.println("Data pushed successfull");
  } else {
    Serial.println("Push error" + String(x));
  }
  Serial.println("====================");

  delay(10000);
}
```

### Control Tower Thnkgspeak Dashboard

<img id="myImg" alt="Control Tower Channel" src="/assets/blog/2024/01-IoT-Control-Tower-Channel.png" width="100%"/>

## Smart Suite

* [Smart Suite on Wokwi](https://wokwi.com/projects/387290485474569217)
* [Smart Suite on Thinkgspeak](https://thingspeak.com/channels/2405104)

The Smart Suit has sensors to control the environment. The temperature sensor automatically enables the Heater, and the motion sensors control living spaces. The sensor implementation is based on the ESP32 platform with DHT22 (Digital Temperature and Humidity Sensor), Relays, and Motion sensors. LEDs serve to indicate enabled relays.

### Smart Suite Diagram

<img id="myImg" alt="Control Tower Channel" src="/assets/blog/2024/01-IoT-Smart-Suit-Sensor.png" width="100%"/>

### Smart Suite Arduino Sketch

```arduino
#include <WiFi.h>
#include "DHTesp.h"
#include "ThingSpeak.h"

// Wifi
const char *WIFI_NAME = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";
WiFiClient client;

// Thingspeak
unsigned long weatherStationChannelNumber = 2405104;
unsigned long myChannelNumber = 2405104;
const char *myWriteAPIKey = "3SGUAWSLXUEL6CIP";

// Pins
const int dhtPin = 15;

const int chHeaterPin = 22;
const int chKitchenPin = 21;
const int chGardenPin = 19;
const int chLivingroomPin = 18;
;
const int pirKitchenPin = 13;
const int pirGardenPin = 12;
const int pirLivingroomPin = 14;

DHTesp dhtSensor;

// Timer variables
unsigned long lastTime = 0;
unsigned long timerDelay = 10000;

int statusCode = 0;
int field[8] = {1, 2, 3, 4};

int chHeater = 0;
int chKitchen = 0;
int chGarden = 0;
int chLivingroom = 0;

float prevTemp = 0;

void setup()
{
  Serial.begin(115200); // Initialize serial
  dhtSensor.setup(dhtPin, DHTesp::DHT22);

  pinMode(chHeaterPin, OUTPUT);
  pinMode(chKitchenPin, OUTPUT);
  pinMode(chGardenPin, OUTPUT);
  pinMode(chLivingroomPin, OUTPUT);
  pinMode(pirKitchenPin, INPUT);
  pinMode(pirGardenPin, INPUT);
  pinMode(pirLivingroomPin, INPUT);

  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Wifi not connected");
  }
  Serial.println("Wifi connected !");
  Serial.println("Local IP: " + String(WiFi.localIP()));
  WiFi.mode(WIFI_STA);
  ThingSpeak.begin(client);
  Serial.println("Welcome at Smart Suite");
}

void loop()
{
  // use ThingSpeak.readMultipleFields(channelNumber, readAPIKey) for private channels
  statusCode = ThingSpeak.readMultipleFields(weatherStationChannelNumber);
  if (statusCode == 200)
  {
    // Fetch the stored data
    chHeater = ThingSpeak.getFieldAsInt(field[2]);     // Field 3
    chKitchen = ThingSpeak.getFieldAsInt(field[3]);    // Field 4
    chGarden = ThingSpeak.getFieldAsInt(field[4]);     // Field 5
    chLivingroom = ThingSpeak.getFieldAsInt(field[5]); // Field 6
  }
  else
  {
    Serial.println("Problem reading channel. HTTP error code " + String(statusCode));
  }

  TempAndHumidity dhtData = dhtSensor.getTempAndHumidity();
  float temperature = dhtData.temperature;
  float humidity = dhtData.humidity;

  if (temperature < 19)
    chHeater = 1;
  else
    chHeater = 0;

  if (digitalRead(pirKitchenPin) == HIGH)
    chKitchen = 1;
  else
    chKitchen = 0;

  if (digitalRead(pirGardenPin) == HIGH)
    chGarden = 1;
  else
    chGarden = 0;

  if (digitalRead(pirLivingroomPin) == HIGH)
    chLivingroom = 1;
  else
    chLivingroom = 0;

  if (chHeater >= 1)
    digitalWrite(chHeater, HIGH);
  if (chHeater == 0)
    digitalWrite(chHeater, LOW);

  if (chKitchen >= 1)
    digitalWrite(chKitchen, HIGH);
  if (chKitchen == 0)
    digitalWrite(chKitchen, LOW);

  if (chGarden >= 1)
    digitalWrite(chGarden, HIGH);
  if (chGarden == 0)
    digitalWrite(chGarden, LOW);

  if (chLivingroom >= 1)
    digitalWrite(chLivingroom, HIGH);
  if (chLivingroom == 0)
    digitalWrite(chLivingroom, LOW);

  Serial.println("Temperature: " + String(temperature));
  Serial.println("Humidity: " + String(humidity));
  Serial.println("Heater: " + String(chHeater));
  Serial.println("Kitchen: " + String(chKitchen));
  Serial.println("Garden: " + String(chGarden));
  Serial.println("Livingroom: " + String(chLivingroom));

  ThingSpeak.setField(1, temperature);
  ThingSpeak.setField(2, humidity);
  ThingSpeak.setField(3, chHeater);
  ThingSpeak.setField(4, chKitchen);
  ThingSpeak.setField(5, chGarden);
  ThingSpeak.setField(6, chLivingroom);

  // Write to ThingSpeak.
  int x = ThingSpeak.writeFields(myChannelNumber, myWriteAPIKey);

  if (x == 200)
    Serial.println("Data pushed successfull");
  else
    Serial.println("Push error" + String(x));
  Serial.println("====================");

  delay(10000);
}
```

### Smart Suite Thnkgspeak Dashboard

<img id="myImg" alt="Smart Suit Channe" src="/assets/blog/2024/01-IoT-Smart-Suit-Channel.png" width="100%"/>

## Village Gate

* [Village Gate on Wokwi](https://wokwi.com/projects/387302369951455233)
* [Village Gate on Thinkgspeak](https://thingspeak.com/channels/2405836)

### Village Gate Diagram

<img id="myImg" alt="Control Tower Channel" src="/assets/blog/2024/01-IoT-Village-Gate-Sensor.png" width="100%"/>

### Village Gate Arduino Sketch

```arduino
#include <WiFi.h>
#include <DHTesp.h>
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <ThingSpeak.h>

// Wifi
const char *WIFI_NAME = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";

// Thingspeak
unsigned long myChannelNumber = 2405836;
const char *myAPIKey = "DJ8PF7L6ASVSGZXN";

// Pins
const int pirPin = 2; // pir
const int beeperPin = 12;
const int ledPin = 13;
const int dhtPin = 15;
const int servoPin = 18;
const int photoresistorAnalogPin = A0;
const int photoresistorDigitalPin = 33;

// Variables
const float GAMMA = 0.7;
const float RL10 = 50;
int day = 0;
int pos = 0;
Servo servo;
WiFiClient client;
DHTesp dhtSensor;

void setup()
{
  Serial.begin(115200);
  dhtSensor.setup(dhtPin, DHTesp::DHT22);

  pinMode(ledPin, OUTPUT);
  pinMode(beeperPin, OUTPUT);
  pinMode(pirPin, INPUT);
  pinMode(photoresistorAnalogPin, INPUT);
  servo.attach(servoPin, 500, 2400);

  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Wifi not connected");
  }
  Serial.println("Wifi connected !");
  Serial.println("Local IP: " + String(WiFi.localIP()));
  WiFi.mode(WIFI_STA);
  ThingSpeak.begin(client);
}

void loop()
{
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  String temperature = String(data.temperature, 2);
  String humidity = String(data.humidity, 2);

  // Photoresistor
  float valueLDR = analogRead(photoresistorAnalogPin);
  valueLDR = map(valueLDR, 4095, 0, 1024, 0);
  float voltage = valueLDR / 1024. * 5;
  float resistance = 2000 * voltage / (1 - voltage / 5);
  float lux = pow(RL10 * 1e3 * pow(10, GAMMA) / resistance, (1 / GAMMA));
  day = digitalRead(photoresistorDigitalPin);

  Serial.println("Temperature: " + String(temperature));
  Serial.println("Humidity: " + String(humidity));
  Serial.println("Light: " + String(lux));
  Serial.println("Day: " + String(day));

  // Moution Sensor and Beeper
  if (digitalRead(pirPin) == HIGH) {
    Serial.println("Opening Gates");
    ThingSpeak.setField(4, 1);
    digitalWrite(beeperPin, HIGH);
    while (pos <= 180) {
      servo.write(pos);
      delay(15);
      pos++;
    }
  } else {
    Serial.println("Closing Gates");
    ThingSpeak.setField(4, 0);
    digitalWrite(beeperPin, LOW);
    while (pos >= 0) {
      servo.write(pos);
      delay(15);
      pos--;
    }
  }

  ThingSpeak.setField(1, temperature);
  ThingSpeak.setField(2, humidity);
  ThingSpeak.setField(3, lux);

  // Write to ThingSpeak.
  int x = ThingSpeak.writeFields(myChannelNumber, myAPIKey);
  if (x == 200)
    Serial.println("Data pushed successfull");
  else
    Serial.println("Push error" + String(x));
  Serial.println("====================");

  delay(100);
}
```

### Village Gate Thnkgspeak Dashboard

<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-Viladge-Gate-Channel.png" width="100%"/>

## Thingspeak Features

The Thingspeak platform has many additional features. I briefly describe four of them:

* [MATLAB Analysis](https://thingspeak.com/apps/matlab_analyses)
* [MATLAB Visualization](https://thingspeak.com/apps/matlab_visualizations)
* [TimeControls](https://thingspeak.com/apps/timecontrols) — Scheduling Tool
* [Reacts](https://thingspeak.com/apps/reacts) — Event and Trigger System

All of them are straightforward, and you just need to click on the appropriate button and fill in gaps in a template with your channel specifications. Below, I post a couple of screenshots.

### Thingspeak MATLAB Analysis

<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-MATLAB-Average-Humidity.png" width="100%"/>

**Code:**

```matlab
% Read humidity over the past hour from a ThingSpeak Channel ID:
readChannelID = 2405835;

% Humidity Field ID:
humidityFieldID = 2;

% Channel Read API Key
readAPIKey = 'A7Z0HM3FCML7T3M0';

% Get humidity data for the last 3600 minutes from the Control Tower Channel.
humidity = thingSpeakRead(readChannelID,'Fields',humidityFieldID, 'NumMinutes',3600,'ReadKey',readAPIKey);

% Calculate the average humidity:
avgHumidity = mean(humidity);

% Display Results:
display(avgHumidity,'Average Humidity');

% Channel ID to write data to:
writeChannelID = 2406151;
% Enter the Write API Key between the '' below:
writeAPIKey = '34UF5KAH58EBRN5Q';

% Write average humidity to another channel
thingSpeakWrite(writeChannelID,avgHumidity,'WriteKey',writeAPIKey);
```

### Thingspeak MATLAB Visualization

<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-MATLAB-Humidity-Temperature-Visualization.png" width="100%"/>

**Code:**

```matlab
% Temperature/Humidity Correlation

% Channel ID to read data from:
readChannelID = 2405835;
% Temperature Field ID to read data from:
fieldID1 = 1;
% Humidity Field ID to read data from:
fieldID2 = 2;

% Channel Read API Key
readAPIKey = 'A7Z0HM3FCML7T3M0';

% Read Temperature
temperature = thingSpeakRead(readChannelID, 'Field', fieldID1, 'NumPoints', 30, 'ReadKey', readAPIKey);
% Read Humidity
humidity = thingSpeakRead(readChannelID, 'Field', fieldID2, 'NumPoints', 30, 'ReadKey', readAPIKey);

%% Visualize Data %%
scatter(temperature, humidity);
```

### Thingspeak TimeControls

<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-TimeControl_1.png" width="45%"/>
<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-TimeControl_2.png" width="50%"/>

### Thingspeak Reacts

<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-React_1.png" width="45%"/>
<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-React_3.png" width="50%"/>
<img id="myImg" alt="Viladge Gate Channel" src="/assets/blog/2024/01-IoT-React_2.png" width="50%"/>
