from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1] / "frontend"


def calculate_hazard(wind_speed, rainfall, pressure, storm_surge):
    """
    Prototype cyclone hazard scoring model.

    This is a demonstration model for the hackathon.
    It is NOT an official meteorological forecast.
    """

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


class Handler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(
            *args,
            directory=str(ROOT),
            **kwargs
        )

    def do_GET(self):

        if self.path == "/api/health":

            payload = {
                "status": "ok",
                "service": "cyclone-impact-graph",
                "mode": "prototype"
            }

            body = json.dumps(payload).encode()

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/json"
            )
            self.send_header(
                "Content-Length",
                str(len(body))
            )
            self.end_headers()

            self.wfile.write(body)
            return

        super().do_GET()

    def do_POST(self):

        if self.path != "/api/hazard":

            self.send_response(404)
            self.end_headers()
            return

        try:

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(
                content_length
            )

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
            ).encode()

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

            self.wfile.write(
                response_body
            )

        except Exception as error:

            error_body = json.dumps({
                "error": str(error)
            }).encode()

            self.send_response(400)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(error_body))
            )

            self.end_headers()

            self.wfile.write(
                error_body
            )


if __name__ == "__main__":

    print(
        "Cyclone Impact Graph running at "
        "http://127.0.0.1:8000"
    )

    ThreadingHTTPServer(
        ("127.0.0.1", 8000),
        Handler
    ).serve_forever()
