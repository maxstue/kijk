# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-slim as base

# TODO use pnpm
LABEL fly_launch_runtime="Vite"

# Vite app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential node-gyp pkg-config

# Install node modules
COPY --link package.json ./
RUN npm install --include=dev

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM caddy:latest

COPY --from=build /app/dist /var/www/html
COPY config/Caddyfile /Caddyfile
COPY config/env.sh /docker-entrypoint.d/env.sh

# TODO use a non-root user
# RUN ln -sf /bin/bash /bin/sh
# RUN useradd -ms /bin/bash  solid
# USER solid

RUN chmod +x /docker-entrypoint.d/env.sh
ENTRYPOINT [ "/docker-entrypoint.d/env.sh" ]
CMD ["caddy", "run", "--config", "/Caddyfile"]
