from http.server import BaseHTTPRequestHandler
import json


def calculate_hazard(wind_speed, rainfall, pressure, storm_surge):
    """
    Prototype cyclone hazard scoring model.

    This is a hackathon demonstration model.
    It is NOT an official meteorological forecast.
    """

    wind_score = min(wind_speed / 2.0, 50)

    rain_score = min(rainfall / 5.0, 20)

    pressure_score = max(
        0,
        min((1013 - pressure) / 2.0, 20)
    )

    surge_score = min(storm_surge * 5.0, 10)

    score = (
        wind_score
        + rain_score
        + pressure_score
        + surge_score
    )

    score = round(min(score, 100))

    if score >= 75:
        risk_level = "HIGH"

    elif score >= 50:
        risk_level = "MODERATE"

    else:
        risk_level = "LOW"

    return {
        "hazard_score": score,
        "risk_level": risk_level
    }


class handler(BaseHTTPRequestHandler):

    def do_POST(self):

        if self.path != "/api/hazard":
            self.send_response(404)
            self.end_headers()
            return

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
                "status": "success",

                "inputs": {
                    "wind_speed": wind_speed,
                    "rainfall": rainfall,
                    "pressure": pressure,
                    "storm_surge": storm_surge
                },

                "result": result,

                "mode": "prototype"
            }

            response_body = json.dumps(
                response
            ).encode()

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Access-Control-Allow-Origin",
                "*"
            )

            self.send_header(
                "Content-Length",
                str(len(response_body))
            )

            self.end_headers()

            self.wfile.write(response_body)

        except Exception as error:

            response = {
                "status": "error",
                "message": str(error)
            }

            response_body = json.dumps(
                response
            ).encode()

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
