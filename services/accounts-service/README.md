# accounts-service

Accounts and transactions (mock bank data). E2-S1.

Spring Boot 4.2, Java 21 (Amazon Corretto). Mock data only. Port **8081** (override with `SERVER_PORT`).

```sh
./mvnw verify            # tests + lint (Spotless)
./mvnw spotless:apply    # fix formatting
./mvnw spring-boot:run   # http://localhost:8081/actuator/health
docker build -t accounts-service .
```

Endpoints are added by its E2 story; for now only `/actuator/health` and `/actuator/info` exist.
