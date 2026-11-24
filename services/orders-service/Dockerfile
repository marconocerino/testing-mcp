# Build
FROM maven:3.9-amazoncorretto-21-alpine AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests -Dspotless.check.skip=true

# Run
# Amazon Corretto 21.0.10 on Alpine
FROM amazoncorretto:21.0.10-alpine3.22
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /src/target/orders-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8082
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:8082/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
