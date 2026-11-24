# orders-service

Order preview, paper-trade placement, list and cancel (mock, paper trading only). E2-S2.

Spring Boot 4.2, Java 25. Mock data only. Port **8082** (override with `SERVER_PORT`).

```sh
./mvnw verify            # tests + lint (Spotless)
./mvnw spotless:apply    # fix formatting
./mvnw spring-boot:run   # http://localhost:8082/actuator/health
docker build -t orders-service .
```

Endpoints are added by its E2 story; for now only `/actuator/health` and `/actuator/info` exist.
