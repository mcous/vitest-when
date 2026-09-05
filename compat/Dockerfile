ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim

ARG VITEST_VERSION=latest
ARG TS_VERSION=latest
ARG NPM_VERSION=11
ARG MODE=runtime

WORKDIR /app

# npm 10, bundled with Node 20 and 22, crashes with "Cannot read properties of
# null (reading 'edgesOut')" resolving Vitest 4's peer graph. Node 18 keeps its
# bundled npm 9, which is unaffected; npm 11 requires Node >=20.17.
RUN if [ "${NPM_VERSION}" != "bundled" ]; then npm install -g npm@${NPM_VERSION}; fi

# Dependencies first, so this layer caches per (node, vitest) across rebuilds of
# dist. apply-cell.mjs is staged outside /app so it cannot land in coverage.
COPY package.json ./
COPY compat/apply-cell.mjs /tmp/
RUN node /tmp/apply-cell.mjs "${MODE}" "${VITEST_VERSION}" "${TS_VERSION}" \
 && npm install --no-audit --no-fund

COPY compat/vitest.config.${MODE}.ts ./vitest.config.ts
COPY compat/tsconfig.json ./
COPY src/ ./src/
COPY dist/ ./dist/
COPY test/ ./test/
COPY example/ ./example/

COPY compat/run-cell.sh ./
ENV MODE=${MODE}
ENTRYPOINT ["./run-cell.sh"]
