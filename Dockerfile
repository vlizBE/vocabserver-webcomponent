FROM node:18-alpine AS build

WORKDIR /build
COPY . .
RUN npm install
RUN npm install --global rollup
RUN rollup -c

FROM semtech/static-file-service:0.2.0

COPY --from=build build/dist /data
