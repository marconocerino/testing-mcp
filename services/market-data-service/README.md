# market-data-service

Instrument search, quotes with simulated prices, holdings (mock). E2-S3.

Spring Boot 4.2, Java 25. Mock data only. Port **8083** (override with `SERVER_PORT`).

```sh
./mvnw verify            # tests + lint (Spotless)
./mvnw spotless:apply    # fix formatting
./mvnw spring-boot:run   # http://localhost:8083/actuator/health
docker build -t market-data-service .
```

Endpoints are added by its E2 story; for now only `/actuator/health` and `/actuator/info` exist.
