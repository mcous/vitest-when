ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim

ARG VITEST_VERSION=latest
ARG MODE=runtime

# the node images ship a non-root `node` user; nothing here needs root
WORKDIR /app
RUN chown node:node /app
USER node

# Set devDependencies to emulate a project installing `vitest-when` themselves
COPY --chown=node:node package.json ./
RUN typescript=$(npm pkg get devDependencies.typescript | tr -d '"') \
 && expect_type=$(npm pkg get devDependencies.expect-type | tr -d '"') \
 && types_node=$(npm pkg get "devDependencies.@types/node" | tr -d '"') \
 && npm pkg delete devDependencies scripts packageManager \
 && if [ "${MODE}" = "typecheck" ]; then \
      npm pkg set scripts.test='tsc --noEmit' \
        "devDependencies.vitest=${VITEST_VERSION}" \
        "devDependencies.typescript=$typescript" \
        "devDependencies.expect-type=$expect_type" \
        "devDependencies.@types/node=$types_node"; \
    else \
      npm pkg set scripts.test='vitest run --coverage' \
        "devDependencies.vitest=${VITEST_VERSION}" \
        "devDependencies.@vitest/coverage-istanbul=${VITEST_VERSION}"; \
    fi \
 && npm install --no-audit --no-fund \
 && npm cache clean --force

COPY --chown=node:node compat/vitest.config.ts ./
COPY --chown=node:node compat/tsconfig.compat.json ./tsconfig.json
COPY --chown=node:node src/ ./src/
COPY --chown=node:node dist/ ./dist/
COPY --chown=node:node test/ ./test/

CMD ["npm", "test"]
