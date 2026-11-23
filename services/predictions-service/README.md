# predictions-service

Synthetic price forecasts with confidence range (placeholder model). E2-S4.

Spring Boot 4.2, Java 25. Mock data only. Port **8084** (override with `SERVER_PORT`).

```sh
./mvnw verify            # tests + lint (Spotless)
./mvnw spotless:apply    # fix formatting
./mvnw spring-boot:run   # http://localhost:8084/actuator/health
docker build -t predictions-service .
```

Endpoints are added by its E2 story; for now only `/actuator/health` and `/actuator/info` exist.
