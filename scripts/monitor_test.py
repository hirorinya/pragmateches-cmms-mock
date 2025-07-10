
API_URL = "https://pragmateches-cmms-mock-two.vercel.app/api/process/monitor"

def send_process_data():
      # Simulate varying data
      temp = 45 + random.uniform(-5, 50)  # 40-95°C
      vibration = 1.2 + random.uniform(-0.5, 3.8)  # 0.7-5.0 mm/s
      flow = 125 + random.uniform(-110, 100)  # 15-225 m³/h

      data = {
          "data": [
              {
                  "parameter_id": "TI-101-01",
                  "timestamp": datetime.now().isoformat(),
                  "value": round(temp, 1),
                  "quality": "GOOD",
                  "source": "DCS"
              },
              {
                  "parameter_id": "VI-100-01",
                  "timestamp": datetime.now().isoformat(),
                  "value": round(vibration, 2),
                  "quality": "GOOD",
                  "source": "DCS"
              },
              {
                  "parameter_id": "FI-100-01",
                  "timestamp": datetime.now().isoformat(),
                  "value": round(flow, 1),
                  "quality": "GOOD",
                  "source": "DCS"
              }
          ]
      }

      try:
          response = requests.post(API_URL, json=data)
          result = response.json()
          print(f"[{datetime.now().strftime('%H:%M:%S')}] Temp: {temp:.1f}°C, Vib: {vibration:.2f}mm/s, Flow: {flow:.1f}m³/h")
          print(f"  → Processed: {result.get('processed', 0)}, Triggers: {result.get('triggers_detected', 0)}, Notifications: {result.get('es_notifications', 0)}")
      except Exception as e:
          print(f"Error: {e}")

  # Send data every 30 seconds
print("Starting process data simulation...")
print("Press Ctrl+C to stop")
while True:
      send_process_data()
      time.sleep(30)
