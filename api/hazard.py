from http.server import BaseHTTPRequestHandler
import json


def calculate_hazard(wind_speed, rainfall, pressure, storm_surge):

    wind_score = min(wind_speed / 2.0, 50)
    rain_score = min(rainfall / 5.0, 20)
    pressure_score = max(0, min((1013 - pressure) / 2.0, 20))
    surge_score = min(storm_surge * 5.0, 10)

    score = wind_score + rain_score + pressure_score + surge_score
    score = round(min(score, 100))

    if score >= 75:
        level = "HIGH"
    elif score >= 50:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "hazard_score": score,
        "risk_level": level
    }


class handler(BaseHTTPRequestHandler):

    def do_GET(self):

        response = {
            "status": "ok",
            "service": "cyclone-impact-graph",
            "mode": "prototype"
        }

        body = json.dumps(response).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

        self.wfile.write(body)

    def do_POST(self):

        try:

            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            body = self.rfile.read(content_length)

            data = json.loads(body)

            wind_speed = float(
                data.get("wind_speed", 0)
            )

            rainfall = float(
                data.get("rainfall", 0)
            )

            pressure = float(
                data.get("pressure", 1013)
            )

            storm_surge = float(
                data.get("storm_surge", 0)
            )

            result = calculate_hazard(
                wind_speed,
                rainfall,
                pressure,
                storm_surge
            )

            response = {
                "inputs": {
                    "wind_speed": wind_speed,
                    "rainfall": rainfall,
                    "pressure": pressure,
                    "storm_surge": storm_surge
                },
                "result": result
            }

            response_body = json.dumps(
                response
            ).encode("utf-8")

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(response_body))
            )

            self.end_headers()

            self.wfile.write(response_body)

        except Exception as error:

            response = {
                "error": str(error)
            }

            response_body = json.dumps(
                response
            ).encode("utf-8")

            self.send_response(400)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(response_body))
            )

            self.end_headers()

            self.wfile.write(response_body)
