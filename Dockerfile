FROM node:14 as node-build-env
ARG RATEL_COMMIT_ID
ARG RATEL_COMMIT_INFO
WORKDIR /usr/src/app
COPY client/package.json client/package-lock.json ./
COPY client ./
RUN npm ci
RUN npm run build:prod

FROM golang:1.16 as go-build-env
WORKDIR /go/src/app
COPY --from=node-build-env /usr/src/app/build /go/src/app/client/build
COPY go.mod main.go /go/src/app/
COPY scripts ./scripts/
COPY server ./server/
RUN ["/bin/bash", "-c", "source /go/src/app/scripts/functions.sh && buildServer true"]

FROM gcr.io/distroless/base:latest as release
COPY --from=go-build-env /go/src/app/build/ratel /dgraph-ratel
CMD ["/dgraph-ratel"]
